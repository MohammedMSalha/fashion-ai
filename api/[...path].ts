export default async function handler(req: any, res: any) {
  try {
    console.log("[Serverless] Request received:", req.method, req.url);
    
    // Test if function can be invoked
    if (req.url === "/api/health") {
      return res.status(200).json({ status: "ok" });
    }

    // For now, return 404 for other endpoints
    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("[Serverless] Error:", error);
    return res.status(500).json({
      error: "Server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
