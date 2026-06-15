import { NextResponse } from "next/server";
import { networkInterfaces } from "os";

export async function GET() {
  // In production, we don't need this as window.location.origin works perfectly
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ip: null });
  }

  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return NextResponse.json({ ip: net.address });
      }
    }
  }
  
  return NextResponse.json({ ip: null });
}
