export default function handler(req: any, res: any) {
  console.log("[API] Request received:", req.method, req.url);

  // Simple health check endpoint
  if (req.method === "GET" && req.url === "/api/health") {
    return res.status(200).json({
      status: "ok",
      message: "API endpoint is reachable",
      timestamp: new Date().toISOString(),
    });
  }

  // For now, return error for all other routes
  // Once we verify this endpoint works, we'll add the full server
  return res.status(404).json({
    success: false,
    error: "API endpoint not found",
    path: req.url,
    method: req.method,
    note: "API is being initialized...",
  });
}
