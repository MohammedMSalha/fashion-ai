import { createServer } from "../server/index.js";
import serverless from "serverless-http";

let cachedApp: any = null;
let cachedHandler: any = null;

async function getHandler() {
  if (!cachedHandler) {
    try {
      const app = await createServer();
      cachedHandler = serverless(app);
      cachedApp = app;
    } catch (error) {
      console.error("[Serverless] Failed to initialize Express app:", error);
      throw error;
    }
  }
  return cachedHandler;
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

    console.log("[Vercel Serverless]", req.method, req.url);

    const handler = await getHandler();
    await handler(req, res);
  } catch (error) {
    console.error("[Vercel Serverless] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      });
    }
  }
}
