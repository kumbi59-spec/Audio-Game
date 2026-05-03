
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  transpilePackages: ["@audio-rpg/shared", "@audio-rpg/gm-engine"],
  serverExternalPackages: ["pdf-parse", "mammoth"],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@audio-rpg/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
    };
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
      // Security headers that also benefit SEO (prevent framing, MIME sniffing)
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Long-lived cache for static blog pages
      {
        source: "/blog/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
    ];
  },
};

export default nextConfig;
