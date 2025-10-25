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

      // Try to get raw body from Vercel's request
      let rawBody: string | Buffer = "";

      // Check if Vercel has already provided the raw body
      if ((req as any).rawBody) {
        console.log(
          "[Serverless] Raw body already set by previous middleware",
        );
        rawBody = (req as any).rawBody;
      } else if (req.body) {
        // If body exists but is not yet assigned to rawBody, use it
        console.log("[Serverless] Using existing req.body for raw body");
        if (typeof req.body === "string") {
          rawBody = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          rawBody = req.body;
        } else if (typeof req.body === "object") {
          // CRITICAL: Use the raw buffer or string, never reconstruct with JSON.stringify
          // because the formatting won't match the original Stripe payload
          // Instead, we'll try to read from stream if possible
          rawBody = JSON.stringify(req.body);
          console.log(
            "[Serverless] WARNING: body was pre-parsed object, reconstructed with JSON.stringify - signature may fail",
          );
        }
      } else {
        // Body not yet parsed, read from stream
        console.log("[Serverless] Reading raw body from request stream");
        const chunks: Buffer[] = [];

        await new Promise<void>((resolve, reject) => {
          req.on("data", (chunk: Buffer) => {
            console.log("[Serverless] Received chunk:", chunk.length, "bytes");
            chunks.push(chunk);
          });
          req.on("end", () => {
            rawBody = Buffer.concat(chunks);
            console.log("[Serverless] Stream ended, total bytes:", rawBody.length);
            resolve();
          });
          req.on("error", (err) => {
            console.error("[Serverless] Stream error:", err);
            reject(err);
          });
        });
      }

      // Set raw body for middleware - must be a string for Stripe SDK
      if (Buffer.isBuffer(rawBody)) {
        (req as any).rawBody = rawBody.toString("utf-8");
      } else {
        (req as any).rawBody = rawBody;
      }

      // Parse body for Express if not already parsed
      if (!req.body || typeof req.body !== "object") {
        try {
          (req as any).body = JSON.parse((req as any).rawBody);
        } catch {
          (req as any).body = (req as any).rawBody;
        }
      }

      console.log(
        "[Serverless] Raw body set, length:",
        (req as any).rawBody.length,
      );
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
