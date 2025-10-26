import { createServer } from "../server/index.js";

let cachedApp: any = null;

async function getApp() {
  if (!cachedApp) {
    try {
      console.log("[Serverless] Initializing Express app...");
      cachedApp = await createServer();
      console.log("[Serverless] Express app created and cached");
    } catch (error) {
      console.error("[Serverless] Failed to initialize Express app:", error instanceof Error ? error.message : error);
      throw error;
    }
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers for all responses
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Stripe-Signature",
    );
    res.setHeader("Cache-Control", "no-store");

    // Handle OPTIONS
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    const path = req.url?.split("?")[0] || req.url || "unknown";
    console.log(`[Serverless] ${req.method} ${path}`);

    // Get the Express app
    const app = await getApp();
    
    // Call Express app directly
    // Vercel's req/res are already Node.js compatible
    console.log("[Serverless] Forwarding to Express");
    app(req, res);
  } catch (error) {
    console.error("[Serverless] Fatal error:", error instanceof Error ? error.message : error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
