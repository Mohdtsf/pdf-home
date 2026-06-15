import React, { useState, useEffect, useRef } from "react";
import { X, Copy, Check, Smartphone, Wifi, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  fileName: string;
}

export function ShareModal({ isOpen, onClose, pdfBlob, fileName }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"initializing" | "ready" | "connected" | "transferring" | "done" | "error">("initializing");
  const peerRef = useRef<import("peerjs").Peer | null>(null);

  useEffect(() => {
    if (!isOpen || !pdfBlob) return;
    
    let isMounted = true;
    
    const initPeer = async () => {
      try {
        setStatus("initializing");
        // Dynamically import PeerJS so it only loads on client
        const { Peer } = await import("peerjs");
        
        const peer = new Peer();
        peerRef.current = peer;
        
        peer.on("open", async (id) => {
          if (!isMounted) return;
          
          let origin = window.location.origin;
          
          // Fix for local development: Replace localhost with actual network IP
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            try {
              const res = await fetch("/api/network-ip");
              const data = await res.json();
              if (data.ip) {
                origin = `http://${data.ip}:${window.location.port || 3000}`;
              }
            } catch (e) {
              console.error("Failed to fetch network IP for local development", e);
            }
          }

          // Generate the share URL
          const url = `${origin}/download/${id}?name=${encodeURIComponent(fileName)}`;
          setShareUrl(url);
          setStatus("ready");
        });

        peer.on("connection", (conn) => {
          if (!isMounted) return;
          setStatus("connected");
          
          conn.on("data", (data: unknown) => {
            const payload = data as { type?: string; file?: Blob; fileName?: string };
            if (payload?.type === "REQUEST_FILE") {
              setStatus("transferring");
              // Send the file blob
              conn.send({
                type: "FILE_TRANSFER",
                file: pdfBlob,
                fileName: fileName
              });
              
              // We simulate done after sending, though actual transfer might take a moment
              setTimeout(() => {
                if (isMounted) {
                  setStatus("done");
                  // Return to ready state after 3 seconds so another device can scan
                  setTimeout(() => {
                    if (isMounted) setStatus("ready");
                  }, 3000);
                }
              }, 1500);
            }
          });
        });

        peer.on("error", (err: Error & { type?: string }) => {
          console.error("PeerJS error:", err);
          // Ignore non-fatal errors like a peer disconnecting abruptly
          if (err.type === "peer-unavailable" || err.type === "disconnected" || err.type === "webrtc") {
            if (isMounted) {
              setStatus(prev => prev !== "initializing" ? "ready" : prev);
            }
            return;
          }
          if (isMounted) setStatus("error");
        });
      } catch (err) {
        console.error("Failed to initialize PeerJS:", err);
        if (isMounted) setStatus("error");
      }
    };

    initPeer();

    return () => {
      isMounted = false;
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setShareUrl("");
    };
  }, [isOpen, pdfBlob, fileName]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-glass)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-glass)]">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            Share to Mobile
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {status === "initializing" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-[var(--color-text-secondary)]">Generating secure connection...</p>
            </div>
          )}

          {(status === "ready" || status === "connected" || status === "transferring" || status === "done") && (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  Scan this QR code with your phone camera
                </p>
                <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1">
                  <Wifi className="w-3 h-3" />
                  Direct peer-to-peer connection. File never leaves your devices.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-inner mb-6 relative group">
                <QRCodeSVG 
                  value={shareUrl} 
                  size={200}
                  level="H"
                  includeMargin={false}
                />
                {status !== "ready" && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in">
                    {status === "connected" && (
                      <>
                        <div className="w-8 h-8 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin mb-2" />
                        <p className="text-sm font-medium text-indigo-600">Device connected...</p>
                      </>
                    )}
                    {status === "transferring" && (
                      <>
                        <Download className="w-8 h-8 text-indigo-500 animate-bounce mb-2" />
                        <p className="text-sm font-medium text-indigo-600">Sending file...</p>
                      </>
                    )}
                    {status === "done" && (
                      <>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-green-600">Transfer complete!</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="w-full space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] ml-1">
                  Or copy link
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareUrl}
                    className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-glass)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-indigo-500/50"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-glass)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface)] transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {status === "error" && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Connection Error</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Failed to establish a peer connection. Please try again.
              </p>
              <button 
                onClick={onClose}
                className="btn-secondary px-6"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
