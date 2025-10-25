import { createServer } from "../server/index.js";
import { IncomingMessage, ServerResponse } from "http";

let cachedServer: any = null;
let serverInitPromise: Promise<any> | null = null;

async function getServer() {
  if (cachedServer) {
    console.log("[Handler] Using cached server");
    return cachedServer;
  }
  if (serverInitPromise) {
    console.log("[Handler] Waiting for server initialization");
    return serverInitPromise;
  }

  console.log("[Handler] Starting server initialization");
  serverInitPromise = createServer();
  cachedServer = await serverInitPromise;
  console.log("[Handler] Server initialized successfully");
  return cachedServer;
}

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse,
) {
  try {
    console.log(
      "[Handler] Incoming request:",
      req.method,
      req.url,
      "Headers:",
      Object.keys(req.headers),
    );

    const app = await getServer();

    console.log(
      "[Handler] Express app ready, routing:",
      req.method,
      req.url,
    );

    // Create a promise that resolves when the response is finished
    return new Promise<void>((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error("[Handler] Request timeout after 25 seconds");
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
        console.log(
          "[Handler] Response finished with status:",
          res.statusCode,
        );
        resolve();
      });

      res.on("error", (err) => {
        clearTimeout(timeout);
        console.error("[Handler] Response error:", err);
        reject(err);
      });

      // Call Express app
      try {
        console.log("[Handler] Calling Express app handler");
        app(req, res);
      } catch (err) {
        clearTimeout(timeout);
        console.error("[Handler] Express error:", err);
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
    console.error("[Handler] Fatal error:", error);
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
