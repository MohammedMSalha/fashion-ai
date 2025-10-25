import serverless from "serverless-http";

console.log("[VercelAPI] Module loaded");

let handler: any = null;

async function initializeHandler() {
  try {
    console.log("[VercelAPI] Initializing Express server...");
    const { createServer } = await import("../server/index.js");
    const app = await createServer();
    console.log("[VercelAPI] Express server created successfully");

    // Wrap Express app with serverless-http
    handler = serverless(app);
    console.log("[VercelAPI] Handler initialized with serverless-http");
    return handler;
  } catch (error) {
    console.error("[VercelAPI] Failed to initialize server:", error);
    throw error;
  }
}

export default async function apiHandler(req: any, res: any) {
  console.log("[VercelAPI] Request:", {
    method: req.method,
    path: req.url,
    pathname: new URL(req.url || "", "http://localhost").pathname,
  });

  try {
    // Initialize handler on first request
    if (!handler) {
      console.log("[VercelAPI] First request - initializing handler");
      handler = await initializeHandler();
    }

    // Delegate to serverless-wrapped Express app
    return await handler(req, res);
  } catch (error) {
    console.error("[VercelAPI] Handler error:", error);

    // Make sure we don't send headers twice
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
