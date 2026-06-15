"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { Download, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function DownloadPage({ params }: { params: Promise<{ peerId: string }> }) {
  const resolvedParams = use(params);
  const peerId = resolvedParams.peerId;
  
  const searchParams = useSearchParams();
  const fileName = searchParams.get("name") || "downloaded-file.pdf";

  const [status, setStatus] = useState<"connecting" | "requesting" | "receiving" | "done" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const peerRef = useRef<import("peerjs").Peer | null>(null);

  useEffect(() => {
    if (!peerId) return;

    let isMounted = true;

    const connectToPeer = async () => {
      try {
        const { Peer } = await import("peerjs");
        const peer = new Peer();
        peerRef.current = peer;

        peer.on("open", () => {
          if (!isMounted) return;
          setStatus("requesting");
          
          const conn = peer.connect(peerId as string);
          
          conn.on("open", () => {
            if (!isMounted) return;
            // Request the file from the host
            conn.send({ type: "REQUEST_FILE" });
          });

          conn.on("data", (data: unknown) => {
            if (!isMounted) return;
            const payload = data as { type?: string; file?: Blob; fileName?: string };
            if (payload?.type === "FILE_TRANSFER" && payload.file) {
              setStatus("receiving");
              
              // Trigger download
              const blob = new Blob([payload.file], { type: "application/pdf" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = payload.fileName || fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              setStatus("done");
              
              // Close connection after successful transfer
              setTimeout(() => {
                conn.close();
              }, 1000);
            }
          });

          conn.on("close", () => {
            if (isMounted) {
              setStatus((prevStatus) => {
                if (prevStatus !== "done") {
                  setErrorMsg("Connection closed unexpectedly.");
                  return "error";
                }
                return prevStatus;
              });
            }
          });

          conn.on("error", (err) => {
            if (isMounted) {
              setStatus("error");
              setErrorMsg("Connection error: " + err.message);
            }
          });
        });

        peer.on("error", (err) => {
          if (isMounted) {
            setStatus("error");
            setErrorMsg("Failed to connect to the peer network.");
            console.error(err);
          }
        });

      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setErrorMsg("Failed to initialize PeerJS.");
        }
        console.error(err);
      }
    };

    connectToPeer();

    return () => {
      isMounted = false;
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [peerId, fileName]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md glass-card border border-[var(--color-border-glass)] rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
        
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Secure Download
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 truncate w-full px-4">
          {fileName}
        </p>

        {status === "connecting" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Connecting to host device...</p>
          </div>
        )}

        {status === "requesting" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Requesting file transfer...</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">Keep the original page open on your computer.</p>
          </div>
        )}

        {status === "receiving" && (
          <div className="flex flex-col items-center gap-3">
            <Download className="w-6 h-6 text-indigo-400 animate-bounce" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Downloading file...</p>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
            <p className="text-lg font-medium text-green-400">Download Complete!</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Check your downloads folder.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-6 btn-secondary"
            >
              Go to Homepage
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 w-full">
            <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-base font-medium text-red-400">Transfer Failed</p>
            <p className="text-sm text-[var(--color-text-secondary)] bg-red-500/10 p-3 rounded-lg w-full">
              {errorMsg || "The connection was lost. Please ensure the host tab is still open and try scanning the QR code again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
