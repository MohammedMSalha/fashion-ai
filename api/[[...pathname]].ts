import serverless from "serverless-http";

console.log("[Vercel API] Module loading");

let handler: any = null;

async function initializeHandler() {
  if (handler) {
    return handler;
  }

  console.log("[Vercel API] Initializing handler...");
  try {
    const { createServer } = await import("../dist/server/index.mjs");
    const app = await createServer();
    console.log("[Vercel API] Express app created");

    // Wrap Express app with serverless-http
    handler = serverless(app);
    console.log("[Vercel API] Handler initialized");
    return handler;
  } catch (error) {
    console.error("[Vercel API] Initialization error:", error);
    throw error;
  }
}

export default async function apiHandler(req: any, res: any) {
  try {
    console.log("[Vercel API] Request:", req.method, req.url);

    const handlerFn = await initializeHandler();
    return await handlerFn(req, res);
  } catch (error) {
    console.error("[Vercel API] Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
