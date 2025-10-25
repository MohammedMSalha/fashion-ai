import { query } from "../server/db";

export default async function handler(req: any, res: any) {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    const method = req.method || "GET";

    console.log(`[API] ${method} ${pathname}`);

    // Health check
    if (pathname === "/api/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Save video config
    if (pathname === "/api/save-video-config" && method === "POST") {
      try {
        const { email, imageBase64, duration, resolution } = req.body || {};

        if (!email || !imageBase64 || !duration || !resolution) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: false,
              error: "Missing required fields: email, imageBase64, duration, resolution",
            }),
          );
          return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 254) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: "Invalid email" }));
          return;
        }

        // Insert into database
        const result = await query(
          `INSERT INTO videos (email, image_base64, duration, resolution, status)
           VALUES ($1, $2, $3, $4, 'awaiting_payment')
           RETURNING id, created_at, expires_at`,
          [email, imageBase64, duration, resolution],
        );

        if (!result.rows[0]) {
          throw new Error("Failed to create video record");
        }

        const videoRecord = result.rows[0];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: true,
            videoId: videoRecord.id,
            status: "awaiting_payment",
            createdAt: videoRecord.created_at,
          }),
        );
        return;
      } catch (error) {
        console.error("[API] Save config error:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: false,
            error: "Failed to save video configuration",
          }),
        );
        return;
      }
    }

    // Stripe webhook endpoint
    if (pathname === "/api/stripe-webhook" && method === "POST") {
      console.log("[API] Stripe webhook received");

      // Preserve raw body for signature verification
      let body = req.body;
      if (typeof body === "string") {
        (req as any).rawBody = body;
      } else if (Buffer.isBuffer(body)) {
        (req as any).rawBody = body.toString("utf-8");
      } else if (typeof body === "object") {
        (req as any).rawBody = JSON.stringify(body);
      }

      // For now, acknowledge receipt
      // TODO: Verify Stripe signature and process event
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ received: true }));
      return;
    }

    // Default 404
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  } catch (error) {
    console.error("[API] Error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
