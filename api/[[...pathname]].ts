// Lazy import to avoid initialization errors
let cachedQuery: any = null;
let dbInitialized = false;

async function getQueryFunction() {
  if (cachedQuery) return cachedQuery;

  try {
    console.log("[API] Importing database module...");
    console.log("[API] fashion_DATABASE_URL set:", !!process.env.fashion_DATABASE_URL);
    console.log("[API] DATABASE_URL set:", !!process.env.DATABASE_URL);

    const dbModule = await import("../server/db");
    cachedQuery = dbModule.query;

    // Initialize database on first use
    if (!dbInitialized && dbModule.initializeDatabase) {
      console.log("[API] Initializing database...");
      await dbModule.initializeDatabase();
      dbInitialized = true;
      console.log("[API] Database initialized");
    }

    return cachedQuery;
  } catch (error) {
    console.error("[API] Failed to import database:", error);
    return null; // Return null instead of throwing
  }
}

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
              error:
                "Missing required fields: email, imageBase64, duration, resolution",
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

        // Try to insert into database
        try {
          const queryFn = await getQueryFunction();
          if (!queryFn) {
            throw new Error("Database not available");
          }

          const result = await queryFn(
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
        } catch (dbError) {
          console.error("[API] Save config database error:", dbError);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: false,
              error:
                "Database error: " +
                (dbError instanceof Error ? dbError.message : String(dbError)),
            }),
          );
        }
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

    // Stripe webhook endpoint - ACKNOWLEDGE RECEIPT FIRST
    if (pathname === "/api/stripe-webhook" && method === "POST") {
      // Always return 200 immediately (Stripe expects this)
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ received: true }));

      // Process webhook asynchronously in background (don't wait)
      handleWebhookAsync(req).catch((error) => {
        console.error("[Webhook] Async error:", error);
      });
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

// Process webhook asynchronously
async function handleWebhookAsync(req: any) {
  try {
    console.log("[Webhook] Processing webhook asynchronously");

    // Preserve raw body for Stripe signature verification
    let rawBody: string;
    if (typeof req.body === "string") {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf-8");
    } else if (typeof req.body === "object") {
      rawBody = JSON.stringify(req.body);
    } else {
      rawBody = "";
    }

    (req as any).rawBody = rawBody;
    console.log("[Webhook] Raw body length:", rawBody.length);

    // Parse the body
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      console.error("[Webhook] Failed to parse body");
      return;
    }

    console.log("[Webhook] Event type:", event.type);

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("[Webhook] Processing payment_intent.succeeded");
      console.log("[Webhook] Payment ID:", paymentIntent.id);
      console.log("[Webhook] Amount:", paymentIntent.amount);
      console.log("[Webhook] Metadata:", paymentIntent.metadata);

      const videoId = paymentIntent.metadata?.videoId;
      const email = paymentIntent.metadata?.email;

      if (!videoId) {
        console.error("[Webhook] Missing videoId in metadata");
        return;
      }

      // Update videos table with payment info
      try {
        console.log("[Webhook] About to update database for videoId:", videoId);
        const queryFn = await getQueryFunction();

        if (!queryFn) {
          console.error("[Webhook] Database not available");
          return;
        }

        const updateResult = await queryFn(
          `UPDATE videos 
           SET payment_intent_id = $1,
               payment_status = $2,
               payment_amount = $3,
               payment_currency = $4,
               payment_email = $5,
               status = $6
           WHERE id = $7
           RETURNING id, email, image_base64, duration, resolution`,
          [
            paymentIntent.id,
            "succeeded",
            paymentIntent.amount,
            paymentIntent.currency || "usd",
            email || "",
            "processing",
            videoId,
          ],
        );

        if (!updateResult.rows[0]) {
          console.error("[Webhook] Video record not found:", videoId);
          return;
        }

        console.log("[Webhook] ✓ Updated video record:", videoId);
      } catch (dbError) {
        console.error("[Webhook] Database update error:", dbError);
      }
    }
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
  }
}
