import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & { json?: any },
) {
  try {
    console.log("[API] Request:", req.method, req.url);

    // Get pathname without query string
    const pathname = req.url?.split("?")[0] || "/";
    console.log("[API] Pathname:", pathname);

    // Simple health check to verify function works
    if (pathname === "/api/health" || pathname === "health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok", time: new Date().toISOString() }));
      return;
    }

    // Log all requests for debugging
    console.log("[API] No route matched for:", pathname);

    // Default 404 for now
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        error: "Endpoint not found",
      }),
    );
  } catch (error) {
    console.error("[API] Error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
      }),
    );
  }
}
