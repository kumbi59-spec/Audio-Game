import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { registerSessionRoutes } from "./routes/session.js";
import { registerCampaignRoutes } from "./routes/campaigns.js";
import { registerTtsRoutes } from "./routes/tts.js";
import { registerWorldRoutes } from "./routes/worlds.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env["LOG_LEVEL"] ?? "info",
    },
  });

  await app.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
  });
  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  });
  await app.register(websocket);

  app.get("/health", async () => ({ ok: true }));

  await registerWorldRoutes(app);
  await registerCampaignRoutes(app);
  await registerTtsRoutes(app);
  await registerSessionRoutes(app);

  return app;
}

async function start(): Promise<void> {
  const app = await buildServer();
  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    app.log.info(`Audio RPG API listening on :${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("server.ts") === true ||
  process.argv[1]?.endsWith("server.js") === true;

if (invokedDirectly) {
  void start();
}
