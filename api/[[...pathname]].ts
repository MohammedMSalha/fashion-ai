import { VercelRequest, VercelResponse } from "@vercel/node";

console.log("[Vercel API] Module initializing");

let expressApp: any = null;

async function getExpressApp() {
  if (expressApp) {
    return expressApp;
  }

  try {
    console.log("[Vercel API] Loading Express server...");
    const { createServer } = await import("../server/index.js");
    expressApp = await createServer();
    console.log("[Vercel API] Express server loaded successfully");
    return expressApp;
  } catch (error) {
    console.error("[Vercel API] Failed to load Express server:", error);
    throw error;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    console.log("[Vercel API] Request:", {
      method: req.method,
      path: req.url,
      headers: Object.keys(req.headers).join(", "),
    });

    // Get the Express app
    const app = await getExpressApp();

    // Create a simple HTTP request handler
    // Vercel passes the request directly, so we just need to call the Express app
    return new Promise<void>((resolve, reject) => {
      // Handle the request through Express
      const originalEnd = res.end;
      let ended = false;

      res.end = function (...args: any[]) {
        if (!ended) {
          ended = true;
          originalEnd.apply(res, args);
        }
        resolve();
      };

      // If Express doesn't call res.end, resolve after a timeout
      const timeout = setTimeout(() => {
        if (!ended) {
          console.warn("[Vercel API] Request handling timeout");
          ended = true;
          if (!res.headersSent) {
            res.status(500).json({ error: "Request timeout" });
          }
          resolve();
        }
      }, 29000); // Vercel timeout is 30 seconds

      try {
        app(req, res, (err?: any) => {
          clearTimeout(timeout);
          if (err) {
            console.error("[Vercel API] Express middleware error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Internal server error" });
            }
            if (!ended) {
              ended = true;
              res.end();
            }
            resolve();
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error("[Vercel API] Express call error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Server error" });
        }
        if (!ended) {
          ended = true;
          res.end();
        }
        resolve();
      }
    });
  } catch (error) {
    console.error("[Vercel API] Handler error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Server initialization failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
