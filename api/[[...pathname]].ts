import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

console.log("[VercelAPI] Module loaded");

let appInstance: any = null;

async function createServerInstance() {
  try {
    // Try to dynamically import the actual server for full functionality
    const { createServer } = await import("../server/index.js");
    return await createServer();
  } catch (e) {
    console.warn("[VercelAPI] Could not import full server, creating minimal handler:", e);

    // Fallback: create a minimal Express app that returns an error
    const app = express();
    app.use(cors());
    app.use(helmet());

    app.all("*", (req, res) => {
      res.status(500).json({
        error: "Server not available",
        message: "Full server module could not be loaded",
      });
    });

    return app;
  }
}

export default async function handler(req: any, res: any) {
  console.log("[VercelAPI] Handler called:", req.method, req.url);

  try {
    // Initialize app on first request
    if (!appInstance) {
      console.log("[VercelAPI] Initializing app...");
      appInstance = await createServerInstance();
      console.log("[VercelAPI] App initialized");
    }

    // Handle the request through Express
    return new Promise<void>((resolve, reject) => {
      appInstance(req, res, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error("[VercelAPI] Error:", error);
    res.status(500).json({
      error: "Server initialization failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
