import { createServer } from "../server/index.js";
import { IncomingMessage, ServerResponse } from "http";

let cachedServer: any = null;
let serverInitPromise: Promise<any> | null = null;

async function getServer() {
  if (cachedServer) return cachedServer;
  if (serverInitPromise) return serverInitPromise;

  serverInitPromise = createServer();
  cachedServer = await serverInitPromise;
  return cachedServer;
}

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse,
) {
  try {
    const app = await getServer();

    // Preserve raw body for Stripe webhook signature verification
    if (req.url?.includes("/api/stripe-webhook") && req.method === "POST") {
      console.log("[Serverless] Webhook request detected, preserving raw body");

      // Collect raw body
      let rawBody = "";

      // If body is already parsed, reconstruct it
      if (req.body) {
        if (typeof req.body === "string") {
          rawBody = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          rawBody = req.body.toString("utf-8");
        } else {
          rawBody = JSON.stringify(req.body);
        }
      } else {
        // Body not yet parsed, read from stream
        await new Promise<void>((resolve, reject) => {
          let data = "";
          req.on("data", (chunk: Buffer) => {
            data += chunk.toString("utf-8");
          });
          req.on("end", () => {
            rawBody = data;
            resolve();
          });
          req.on("error", reject);
        });
      }

      // Set raw body for middleware
      (req as any).rawBody = rawBody;

      // Parse body for Express
      try {
        (req as any).body = JSON.parse(rawBody);
      } catch {
        (req as any).body = rawBody;
      }

      console.log("[Serverless] Raw body set, length:", rawBody.length);
    }

    // Route to Express app
    console.log(`[Serverless] ${req.method} ${req.url}`);

    // Create a promise that resolves when the response is finished
    return new Promise<void>((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error("[Serverless] Request timeout after 25 seconds");
        if (!res.headersSent) {
          res.statusCode = 504;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Request timeout" }));
        }
        resolve();
      }, 25000);

      // Handle response finish
      res.on("finish", () => {
        clearTimeout(timeout);
        resolve();
      });

      res.on("error", (err) => {
        clearTimeout(timeout);
        console.error("[Serverless] Response error:", err);
        reject(err);
      });

      // Call Express app
      try {
        app(req, res);
      } catch (err) {
        clearTimeout(timeout);
        console.error("[Serverless] Express error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Internal server error",
              message: err instanceof Error ? err.message : String(err),
            }),
          );
        }
        resolve();
      }
    });
  } catch (error) {
    console.error("[Serverless] Fatal error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
