import type { NextConfig } from "next";

type ExtendedNextConfig = NextConfig & {
  allowedDevOrigins?: string[];
};

const nextConfig: ExtendedNextConfig = {
  allowedDevOrigins: ["192.168.1.5", "192.168.1.5:3000", "192.168.1.5:3001"],

  experimental: {
    serverActions: {
      bodySizeLimit: "12mb", //Untuk file upload
    },
  },

  //Izinkan upload ke /public/uploads
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
