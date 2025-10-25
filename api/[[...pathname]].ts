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
