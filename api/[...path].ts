let expressApp: any = null;
let initPromise: Promise<any> | null = null;

async function getExpressApp() {
  if (expressApp) return expressApp;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[Serverless] Initializing Express app...");
      // Import the server module - createServer is a named export
      const serverModule = await import("../server/index.js");
      const createServer = (serverModule as any).createServer;

      if (typeof createServer !== "function") {
        throw new Error("Server module does not export createServer function");
      }

      expressApp = await createServer();
      console.log("[Serverless] Express app initialized");
      return expressApp;
    } catch (error) {
      console.error("[Serverless] Failed to initialize:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const pathname = req.url.split("?")[0]; // Remove query params
    console.log(`[Serverless] ${req.method} ${pathname}`);

    const app = await getExpressApp();

    // For Stripe webhook, preserve the raw body
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request detected, preserving raw body");
      // Store raw body for Stripe signature verification
      if (typeof req.body === "string") {
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString("utf-8");
      } else {
        // If body is already parsed, stringify it
        req.rawBody = JSON.stringify(req.body);
      }
    }

    // Pass through the request to Express
    return new Promise((resolve) => {
      const originalEnd = res.end;
      res.end = function () {
        originalEnd.apply(res, arguments);
        resolve(undefined);
      };

      app(req, res);
    });
  } catch (error) {
    console.error("[Serverless] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server initialization failed",
      details: (error as Error).message,
    });
  }
}
