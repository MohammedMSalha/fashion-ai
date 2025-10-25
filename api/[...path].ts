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
      console.error("[Serverless] Full error details:", {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
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
    // Vercel might have already parsed it, so we reconstruct it
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request detected");
      console.log("[Serverless] req.body type:", typeof req.body);
      console.log(
        "[Serverless] req.body is Buffer:",
        Buffer.isBuffer(req.body),
      );

      // Store raw body for Stripe signature verification
      if (typeof req.body === "string") {
        console.log("[Serverless] Body is string, using as-is");
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        console.log("[Serverless] Body is Buffer, converting to string");
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        console.log("[Serverless] Body is parsed object, stringifying");
        req.rawBody = JSON.stringify(req.body);
      } else {
        console.log("[Serverless] Unknown body type, setting empty string");
        req.rawBody = "";
      }

      console.log("[Serverless] rawBody length:", req.rawBody?.length || 0);
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
