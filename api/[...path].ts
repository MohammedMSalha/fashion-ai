import { createServer } from "../server/index";

let expressApp: any = null;
let initPromise: Promise<any> | null = null;

async function getExpressApp() {
  if (expressApp) return expressApp;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[Serverless] Initializing Express app...");
      expressApp = await createServer();
      console.log("[Serverless] ✓ Express app initialized");
      return expressApp;
    } catch (error) {
      console.error("[Serverless] ✗ Failed to initialize:", error);
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

    const app = await getExpressApp();

    // For Stripe webhook, preserve the raw body
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request detected");

      if (typeof req.body === "string") {
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        req.rawBody = JSON.stringify(req.body);
      } else {
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
