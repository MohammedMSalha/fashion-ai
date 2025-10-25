let expressApp: any = null;

async function initializeApp() {
  if (expressApp) {
    return expressApp;
  }

  console.log("[Vercel API] Initializing Express app...");
  try {
    const { createServer } = await import("../server/index.js");
    expressApp = await createServer();
    console.log("[Vercel API] Express app initialized");
    return expressApp;
  } catch (error) {
    console.error("[Vercel API] Failed to initialize app:", error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  try {
    console.log("[Vercel API] Handling request:", req.method, req.url);

    // Initialize app on first request
    const app = await initializeApp();

    // Call the Express app directly
    return app(req, res);
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
