import { createServer } from "../server/index.js";

export default async function handler(req: any, res: any) {
  try {
    console.log(`[API] ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Stripe-Signature"
    );

    // Handle OPTIONS
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // Create and invoke Express app
    console.log("[API] Creating Express server...");
    const app = await createServer();
    console.log("[API] Express server created, invoking...");
    
    // Call Express app - Vercel req/res are Node.js compatible
    return app(req, res);
  } catch (error) {
    console.error("[API] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
