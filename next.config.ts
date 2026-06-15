import type { NextConfig } from "next";
import { networkInterfaces } from "os";

function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "192.168.31.187";
}

const nextConfig: NextConfig & { allowedDevOrigins?: string[] } = {
  allowedDevOrigins: [getLocalIP()],
};

export default nextConfig;
