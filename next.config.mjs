

const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/game/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
