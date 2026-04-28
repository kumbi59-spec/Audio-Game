
const nextConfig = {
  transpilePackages: ["@audio-rpg/shared", "@audio-rpg/gm-engine"],
  serverExternalPackages: ["pdf-parse", "mammoth"],
  webpack(config) {
    // ESM packages in transpilePackages use .js extensions that map to .ts source files.
    // webpack resolves them literally, so we teach it to try .ts/.tsx before .js.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
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
