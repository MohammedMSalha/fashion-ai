import { Pool } from "pg";

// Database pool - shared across requests
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString =
    process.env.fashion_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Database URL not set. Configure fashion_DATABASE_URL in Vercel environment variables.",
    );
  }

  console.log("[API] Creating database pool...");
  pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err) => {
    console.error("[Pool] Unexpected error on idle client:", err);
  });

  return pool;
}

async function query(text: string, params: any[] = []) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
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

        console.log("[Save Config] Request received");
        console.log("[Save Config] Email:", email);
        console.log("[Save Config] Duration:", duration);
        console.log("[Save Config] Resolution:", resolution);
        console.log("[Save Config] Image length:", imageBase64?.length);

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

        console.log("[Save Config] Inserting into database...");

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
        console.log("[Save Config] ✓ Video created:", videoRecord.id);

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
        console.error("[Save Config] Error:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to save video configuration",
          }),
        );
        return;
      }
    }

    // Create payment intent
    if (pathname === "/api/create-payment-intent" && method === "POST") {
      try {
        const { email, videoId, duration, quality, amount } = req.body || {};

        console.log("[Payment] Create payment intent request");
        console.log("[Payment] Email:", email);
        console.log("[Payment] VideoId:", videoId);
        console.log("[Payment] Amount:", amount);

        if (!email || !videoId || !amount) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: false,
              error: "Missing required fields: email, videoId, amount",
            }),
          );
          return;
        }

        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
          console.error("[Payment] STRIPE_SECRET_KEY not set");
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: false,
              error: "Stripe not configured",
            }),
          );
          return;
        }

        // Dynamic import of Stripe
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeSecret);

        console.log("[Payment] Creating Stripe PaymentIntent...");

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            email,
            videoId: String(videoId),
            duration: String(duration || ""),
            quality: String(quality || ""),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        console.log("[Payment] ✓ PaymentIntent created:", paymentIntent.id);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          }),
        );
        return;
      } catch (error) {
        console.error("[Payment] Error:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Payment intent creation failed",
          }),
        );
        return;
      }
    }

    // Stripe webhook endpoint
    if (pathname === "/api/stripe-webhook" && method === "POST") {
      // Always return 200 immediately (Stripe requirement)
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ received: true }));

      // Process webhook asynchronously
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
        console.log("[Webhook] Updating database for videoId:", videoId);

        const updateResult = await query(
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
