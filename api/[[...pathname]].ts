console.log("[VercelAPI] Module loaded");

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  console.log("[VercelAPI] Handler called:", req.method, req.path || req.url);

  try {
    // Import the compiled server (built by Vite to dist/server/production.mjs)
    // Use dynamic import with proper path for Vercel environment
    if (!appInstance) {
      try {
        // Try the compiled path first (production build)
        const serverModule = await import("../server/production.mjs");
        appInstance = serverModule.default || serverModule.app;
      } catch (e) {
        console.log("[VercelAPI] Compiled import failed, trying TypeScript import...", e);
        // Fallback to TypeScript import for local development
        const { createServer } = await import("../server/index.ts");
        appInstance = await createServer();
      }
    }

    console.log("[VercelAPI] App instance ready, handling request");

    // Handle the request with Express
    if (typeof appInstance === "function") {
      return appInstance(req, res);
    } else {
      // If it's an Express app, use it directly
      return new Promise((resolve) => {
        appInstance(req, res, () => {
          resolve(undefined);
        });
      });
    }
  } catch (error) {
    console.error("[VercelAPI] Error:", error);
    res.status(500).json({
      error: "Server initialization failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
