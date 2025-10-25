console.log("[VercelAPI] Module loaded");

export default async function handler(req: any, res: any) {
  console.log("[VercelAPI] Handler called:", req.method, req.path || req.url);

  try {
    // Dynamic import to avoid build-time issues
    const { createServer } = await import("../server/index.ts");
    const app = await createServer();

    console.log("[VercelAPI] App created, calling handler");
    return app(req, res);
  } catch (error) {
    console.error("[VercelAPI] Error:", error);
    res.status(500).json({
      error: "Server initialization failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
