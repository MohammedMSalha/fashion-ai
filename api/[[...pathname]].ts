import type { VercelRequest, VercelResponse } from "@vercel/node";

let cachedServer: any = null;

async function getExpressApp() {
  if (cachedServer) {
    return cachedServer;
  }

  try {
    console.log("[API] Importing server/index.ts");
    const { createServer } = await import("../server/index.ts");
    cachedServer = await createServer();
    console.log("[API] Server initialized successfully");
    return cachedServer;
  } catch (error) {
    console.error("[API] Failed to initialize server:", error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[API] Handler called:", req.method, req.url);

  try {
    const app = await getExpressApp();
    console.log("[API] Calling Express app");
    return app(req, res);
  } catch (error) {
    console.error("[API] Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
