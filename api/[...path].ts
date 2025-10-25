import serverless from "serverless-http";

// Lazy load the server to avoid module resolution issues
let serverlessHandler: any = null;

async function initializeHandler() {
  if (serverlessHandler) return serverlessHandler;

  try {
    const startTime = Date.now();
    console.log("[API] Initializing server handler...");

    // Dynamic import to handle module resolution
    console.log("[API] Importing server module...");
    const { createServer } = await import("../server/index.js");

    console.log(`[API] Creating Express app... (${Date.now() - startTime}ms)`);
    const app = await createServer();

    console.log(
      `[API] Wrapping with serverless-http... (${Date.now() - startTime}ms)`,
    );
    serverlessHandler = serverless(app);

    console.log(`[API] ✓ Handler ready (${Date.now() - startTime}ms total)`);
    return serverlessHandler;
  } catch (error) {
    console.error("[API] Failed to initialize:", error);
    throw error;
  }
}

export default async (req: any, res: any) => {
  const startTime = Date.now();
  try {
    console.log(`[API] ${req.method} ${req.url}`);
    const handler = await initializeHandler();
    console.log(`[API] Handler ready in ${Date.now() - startTime}ms`);
    return handler(req, res);
  } catch (error) {
    console.error("[API] Request error:", error);
    res.status(500).json({
      success: false,
      error: "Server initialization failed",
      details: (error as Error).message,
    });
  }
};
