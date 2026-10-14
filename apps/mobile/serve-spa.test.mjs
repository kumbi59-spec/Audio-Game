import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { request } from "http";
import { tmpdir } from "os";
import { join } from "path";
import { createSpaServer, resolveRequestPath } from "./serve-spa.mjs";

describe("resolveRequestPath", () => {
  const root = "/srv/web-build";

  it("maps paths inside the root", () => {
    expect(resolveRequestPath(root, "/")).toBe("/srv/web-build/index.html");
    expect(resolveRequestPath(root, "/_expo/app.js?v=1")).toBe("/srv/web-build/_expo/app.js");
    expect(resolveRequestPath(root, "/campaign/abc")).toBe("/srv/web-build/campaign/abc");
  });

  it("rejects paths that climb out of the root", () => {
    expect(resolveRequestPath(root, "/../../etc/passwd")).toBeNull();
    expect(resolveRequestPath(root, "/assets/../../web-build-secrets/key")).toBeNull();
  });
});

describe("createSpaServer", () => {
  let dir;
  let server;
  let port;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "serve-spa-"));
    const root = join(dir, "web-build");
    mkdirSync(root);
    writeFileSync(join(root, "index.html"), "<html>app</html>");
    writeFileSync(join(dir, "secret.txt"), "do not serve");
    server = createSpaServer(root);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  });

  // Node's client sends the path as written, like `curl --path-as-is`.
  function get(path) {
    return new Promise((resolve, reject) => {
      const req = request({ host: "127.0.0.1", port, path }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      });
      req.on("error", reject);
      req.end();
    });
  }

  it("refuses a traversal request instead of reading outside the root", async () => {
    const res = await get("/../secret.txt");
    expect(res.status).toBe(403);
    expect(res.body).not.toContain("do not serve");
  });

  it("still falls back to index.html for app routes", async () => {
    const res = await get("/campaign/abc");
    expect(res.status).toBe(200);
    expect(res.body).toBe("<html>app</html>");
  });
});
