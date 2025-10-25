import { createServer } from "../server/index";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let expressApp: any = null;

async function initializeApp() {
  if (expressApp) return expressApp;
  
  try {
    console.log("[Serverless] Initializing Express app...");
    expressApp = await createServer();
    console.log("[Serverless] Express app initialized successfully");
    return expressApp;
  } catch (error) {
    console.error("[Serverless] Failed to initialize Express app:", error);
    throw error;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
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
        (req as any).rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        console.log("[Serverless] Body is Buffer");
        (req as any).rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        console.log("[Serverless] Body is parsed object, stringifying");
        (req as any).rawBody = JSON.stringify(req.body);
      } else {
        console.log("[Serverless] Unknown body type");
        (req as any).rawBody = "";
      }
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
