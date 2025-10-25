import serverless from "serverless-http";
import { createServer } from "../server/index";

let handler: any = null;
let initError: Error | null = null;

async function getHandler() {
  if (handler) return handler;
  if (initError) throw initError;

  try {
    console.log("[Serverless] Initializing Express app...");
    const app = await createServer();
    console.log("[Serverless] Wrapping with serverless-http...");
    handler = serverless(app);
    console.log("[Serverless] ✓ Handler ready");
    return handler;
  } catch (error) {
    initError = error as Error;
    console.error("[Serverless] ✗ Failed to initialize:", error);
    throw error;
  }
}

export default async function vercelHandler(req: any, res: any) {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    console.log(`[Serverless] ${req.method} ${pathname}`);

    // Get the handler (initializes Express app on first call)
    const handler = await getHandler();

    // Preserve raw body for Stripe webhook
    if (pathname === "/api/stripe-webhook" && req.method === "POST") {
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

    // Route through Express app via serverless-http
    return handler(req, res);
  } catch (error) {
    console.error("[Serverless] Error:", error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: "Server initialization failed",
          details: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
