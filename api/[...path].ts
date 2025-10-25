import serverless from "serverless-http";

// Lazy load the server to avoid module resolution issues
let serverlessHandler: any = null;

async function initializeHandler() {
  if (serverlessHandler) return serverlessHandler;

  try {
    // Dynamic import to handle module resolution
    const { createServer } = await import("../server/index.js");
    const app = await createServer();
    serverlessHandler = serverless(app);
    console.log("[Serverless] Handler initialized successfully");
    return serverlessHandler;
  } catch (error) {
    console.error("[Serverless] Failed to initialize handler:", error);
    throw error;
  }
}

export default async (req: any, res: any) => {
  try {
    const handler = await initializeHandler();
    return handler(req, res);
  } catch (error) {
    console.error("[Serverless] Request error:", error);
    res.status(500).json({
      success: false,
      error: "Server initialization failed",
    });
  }
};
