import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const DATABASE_URL = process.env.DATABASE_URL || process.env.fashion_DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not set");
  }

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5, // Serverless-friendly connection limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  });

  return pool;
}

async function query(sql: string, params?: any[]) {
  const pg = getPool();
  return pg.query(sql, params);
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url || "", "http://localhost");
    const pathname = url.pathname;

    console.log("[API Handler]", req.method, pathname);

    // Health check
    if (pathname === "/api/health") {
      return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    // Get videos by email: GET /api/videos/:email
    if (pathname.startsWith("/api/videos/") && req.method === "GET" && !pathname.includes("DELETE")) {
      const email = decodeURIComponent(pathname.split("/api/videos/")[1]);

      if (!email) {
        return res.status(400).json({ success: false, error: "Email required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: "Invalid email" });
      }

      const result = await query(
        `SELECT id, email, video_url, duration, resolution, status, error_message, created_at, expires_at, request_id,
                payment_intent_id, payment_amount, payment_currency, payment_status, payment_method_type, payment_email
         FROM videos
         WHERE email = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 50`,
        [email],
      );

      return res.status(200).json({
        success: true,
        videos: result.rows,
      });
    }

    // Check SMTP status: GET /api/auth/smtp-status
    if (pathname === "/api/auth/smtp-status" && req.method === "GET") {
      const smtpEnabled = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      );

      return res.status(200).json({
        success: true,
        enabled: smtpEnabled,
        provider: smtpEnabled ? "custom" : null,
      });
    }

    // Check pending videos: GET /api/check-pending/:email
    if (pathname.startsWith("/api/check-pending/") && req.method === "GET") {
      const email = decodeURIComponent(pathname.split("/api/check-pending/")[1]);

      if (!email) {
        return res.status(400).json({ success: false, error: "Email required" });
      }

      // Get pending videos for this email
      const result = await query(
        `SELECT id, request_id, status FROM videos
         WHERE email = $1 AND status = 'processing' AND request_id IS NOT NULL AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 10`,
        [email],
      );

      return res.status(200).json({
        success: true,
        pending: result.rows,
      });
    }

    // Save video config: POST /api/save-video-config
    if (pathname === "/api/save-video-config" && req.method === "POST") {
      const body = req.body || {};
      const { email, imageBase64, duration, resolution } = body;

      // Validate inputs
      if (!email || !imageBase64 || !duration || !resolution) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: email, imageBase64, duration, resolution",
        });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 254) {
        return res.status(400).json({ success: false, error: "Invalid email" });
      }

      // Validate duration and resolution
      if (![5, 10].includes(duration)) {
        return res.status(400).json({
          success: false,
          error: "Duration must be 5 or 10",
        });
      }

      if (!["720p", "1080p"].includes(resolution)) {
        return res.status(400).json({
          success: false,
          error: "Resolution must be 720p or 1080p",
        });
      }

      // Validate image format
      if (typeof imageBase64 !== "string" || imageBase64.length < 100) {
        return res.status(400).json({
          success: false,
          error: "Invalid image data",
        });
      }

      // Insert into database
      const result = await query(
        `INSERT INTO videos (email, image_base64, duration, resolution, status)
         VALUES ($1, $2, $3, $4, 'awaiting_payment')
         RETURNING id, created_at, expires_at`,
        [email, imageBase64, duration, resolution],
      );

      if (!result.rows[0]) {
        return res.status(500).json({
          success: false,
          error: "Failed to create video record",
        });
      }

      const videoRecord = result.rows[0];

      return res.status(200).json({
        success: true,
        videoId: videoRecord.id,
        status: "awaiting_payment",
        createdAt: videoRecord.created_at,
      });
    }

    // Delete video: DELETE /api/videos/:videoId
    if (pathname.startsWith("/api/videos/") && req.method === "DELETE") {
      const videoId = decodeURIComponent(pathname.split("/api/videos/")[1]);

      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: "Video ID required",
        });
      }

      const result = await query(
        `UPDATE videos SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [videoId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Video not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Video deleted",
      });
    }

    // 404 for unknown routes
    return res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path: pathname,
    });
  } catch (error) {
    console.error("[API Handler] Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
