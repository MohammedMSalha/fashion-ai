import { createServer } from "../server/index";

let expressApp: any = null;
let initPromise: Promise<any> | null = null;

async function initializeApp() {
  if (expressApp) return expressApp;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[Serverless] Initializing Express app...");
      expressApp = await createServer();
      console.log("[Serverless] Express app initialized successfully");
      return expressApp;
    } catch (error) {
      console.error("[Serverless] Failed to initialize Express app:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    console.log(`[Serverless] ${req.method} ${pathname}`);

    // Initialize Express app on first request
    const app = await initializeApp();

    // For Stripe webhook, preserve the raw body
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request detected");

      // In Vercel, the body might already be parsed
      // We need to reconstruct the raw body for Stripe signature verification
      if (typeof req.body === "string") {
        console.log("[Serverless] Body is string, using as-is");
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        console.log("[Serverless] Body is Buffer");
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        console.log("[Serverless] Body is parsed object, stringifying");
        req.rawBody = JSON.stringify(req.body);
      } else {
        console.log("[Serverless] Unknown body type");
        req.rawBody = "";
      }

      console.log("[Serverless] rawBody length:", req.rawBody?.length || 0);
    }

    // Pass request to Express app
    return new Promise<void>((resolve) => {
      const originalEnd = res.end.bind(res);

      res.end = function (...args: any[]) {
        originalEnd(...args);
        resolve();
      };

      app(req, res);
    });
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
