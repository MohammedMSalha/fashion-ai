import serverless from "serverless-http";
import { createServer } from "../server/index";

let handler: any = null;

async function initializeHandler() {
  if (handler) return handler;

  try {
    console.log("[Serverless] Creating Express app...");
    const app = await createServer();
    console.log("[Serverless] ✓ App created, wrapping with serverless-http");
    handler = serverless(app);
    console.log("[Serverless] ✓ Handler ready");
    return handler;
  } catch (error) {
    console.error("[Serverless] ✗ Failed to initialize:", error);
    throw error;
  }
}

export default async function vercelHandler(req: any, res: any) {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    console.log(`[Serverless] ${req.method} ${pathname}`);

    const handler = await initializeHandler();

    // Preserve raw body for Stripe webhook
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request - preserving raw body");

      if (typeof req.body === "string") {
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        req.rawBody = JSON.stringify(req.body);
      } else {
        req.rawBody = "";
      }
    }

    return handler(req, res);
  } catch (error) {
    console.error("[Serverless] Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Server initialization failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
