import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow development resources from local IP (e.g., mobile device)
  allowedDevOrigins: ['192.168.1.243'],
  // other config options can be added here
};

export default nextConfig;
