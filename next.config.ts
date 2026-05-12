import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pardonapp.co',
      },
      {
        protocol: 'https',
        // Supabase storage — will be replaced with actual project hostname
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
