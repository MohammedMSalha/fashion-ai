import { createServer } from "../server/index.js";

let cachedApp: any = null;

async function getApp() {
  if (!cachedApp) {
    console.log("[API] Initializing Express server...");
    cachedApp = await createServer();
    console.log("[API] Express server initialized and cached");
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    const method = req.method || "GET";
    const url = req.url || "/";
    const path = req.path || url.split("?")[0];
    const pathname = req.pathname;
    const originalUrl = req.originalUrl;

    console.log(`[API] ========== REQUEST RECEIVED ==========`);
    console.log(`[API] Method: ${method}`);
    console.log(`[API] req.url: ${url}`);
    console.log(`[API] req.path: ${req.path}`);
    console.log(`[API] req.pathname: ${pathname}`);
    console.log(`[API] req.originalUrl: ${originalUrl}`);
    console.log(`[API] req.headers.host: ${req.headers.host}`);
    console.log(`[API] Parsed path: ${path}`);

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Stripe-Signature, X-Requested-With",
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    // Handle CORS preflight
    if (method === "OPTIONS") {
      console.log("[API] Handling OPTIONS preflight");
      res.status(200).end();
      return;
    }

    // Get the Express app
    console.log("[API] Getting Express app...");
    const app = await getApp();

    // Ensure Express receives the full path
    req.url = url;
    req.path = path;

    console.log(`[API] Forwarding to Express: ${method} ${path}`);

    // Call Express app
    const result = app(req, res);

    // Handle async results if needed
    if (result instanceof Promise) {
      await result;
    }

    return result;
  } catch (error) {
    console.error(
      "[API] Fatal error:",
      error instanceof Error ? error.message : error,
    );
    if (error instanceof Error) {
      console.error("[API] Stack trace:", error.stack);
    }
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
        type: error instanceof Error ? error.constructor.name : typeof error,
      });
    }
  }
}
