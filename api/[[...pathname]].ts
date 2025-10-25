import { Pool } from "pg";

// Database pool - shared across requests
let pool: Pool | null = null;
let statusCheckJobStarted = false;

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
    // Initialize status checking job on first request
    if (!statusCheckJobStarted) {
      statusCheckJobStarted = true;
      startStatusCheckingJob();
    }

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

    // Serve image by video ID (for Fashn AI to access)
    const imageMatch = pathname.match(/^\/api\/image\/(\d+)$/);
    if (imageMatch && method === "GET") {
      try {
        const videoId = imageMatch[1];
        console.log("[Image] Serving image for video:", videoId);

        const result = await query(`SELECT image_base64 FROM videos WHERE id = $1`, [videoId]);

        if (!result.rows[0] || !result.rows[0].image_base64) {
          console.error("[Image] Image not found for video:", videoId);
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Image not found" }));
          return;
        }

        const imageBase64 = result.rows[0].image_base64;

        // Extract MIME type from base64 data URL if present
        let mimeType = "image/jpeg"; // Default
        let imageData = imageBase64;

        if (imageBase64.startsWith("data:")) {
          const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            imageData = match[2];
          }
        }

        const buffer = Buffer.from(imageData, "base64");

        res.statusCode = 200;
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end(buffer);
        return;
      } catch (error) {
        console.error("[Image] Error serving image:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Failed to serve image" }));
        return;
      }
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

// Generate video by calling Fashn AI API
async function generateVideoWithFashnAI(
  imageUrl: string,
  duration: 5 | 10,
  resolution: "720p" | "1080p",
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("[GenerateVideo] FASHN_AI_API_KEY not configured");
      return {
        success: false,
        error: "FASHN_AI_API_KEY not configured",
      };
    }

    console.log("[GenerateVideo] Starting video generation");
    console.log("[GenerateVideo] Image URL:", imageUrl);
    console.log(
      "[GenerateVideo] Duration:",
      duration,
      "Resolution:",
      resolution,
    );

    const payload = {
      model_name: "image-to-video",
      inputs: {
        image: imageUrl,
        duration,
        resolution,
      },
    };

    console.log(
      "[GenerateVideo] Sending request to https://api.fashn.ai/v1/run",
    );
    console.log("[GenerateVideo] Payload:", JSON.stringify(payload));

    const response = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[GenerateVideo] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[GenerateVideo] Fashn API error:",
        response.status,
        errorText,
      );
      return {
        success: false,
        error: `Fashn API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("[GenerateVideo] Response data:", JSON.stringify(data));

    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[GenerateVideo] No request ID in response");
      return {
        success: false,
        error: "No request ID received from Fashn API",
      };
    }

    console.log("[GenerateVideo] ✓ Success! Request ID:", requestId);

    return {
      success: true,
      requestId,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Unknown error during video generation";
    console.error("[GenerateVideo] ✗ Error:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

// Check Fashn AI video generation status
async function checkVideoStatus(
  requestId: string,
): Promise<{
  status: "submitted" | "processing" | "completed" | "failed" | "unknown";
  videoUrl?: string;
  error?: string;
}> {
  try {
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("[CheckStatus] FASHN_AI_API_KEY not configured");
      return {
        status: "unknown",
        error: "FASHN_AI_API_KEY not configured",
      };
    }

    console.log("[CheckStatus] Checking status for request:", requestId);

    const response = await fetch(
      `https://api.fashn.ai/v1/requests/${requestId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      console.error(
        "[CheckStatus] Fashn API error:",
        response.status,
        await response.text(),
      );
      return {
        status: "unknown",
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("[CheckStatus] Status response:", JSON.stringify(data));

    return {
      status: data.status || "unknown",
      videoUrl: data.result?.video_url || data.video_url,
      error: data.error,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[CheckStatus] Error:", errorMsg);
    return {
      status: "unknown",
      error: errorMsg,
    };
  }
}

// Start status checking for a video
function startStatusCheckingJob() {
  const checkInterval = 30000; // 30 seconds as requested

  const checkFn = async () => {
    try {
      console.log(
        "[StatusJob] Checking pending videos (every 30 seconds)...",
      );

      // Get all videos that are processing
      const result = await query(
        `SELECT id, request_id FROM videos WHERE status = 'processing' AND request_id IS NOT NULL`,
      );

      for (const row of result.rows) {
        try {
          const statusResult = await checkVideoStatus(row.request_id);

          if (statusResult.status === "completed" && statusResult.videoUrl) {
            console.log(
              `[StatusJob] Video ${row.id} completed! Updating database...`,
            );
            await query(
              `UPDATE videos
               SET status = 'completed',
                   video_url = $1,
                   completed_at = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [statusResult.videoUrl, row.id],
            );
          } else if (statusResult.status === "failed") {
            console.log(
              `[StatusJob] Video ${row.id} failed. Updating database...`,
            );
            await query(
              `UPDATE videos
               SET status = 'failed',
                   error_message = $1
               WHERE id = $2`,
              [statusResult.error || "Generation failed", row.id],
            );
          } else if (
            statusResult.status === "processing" ||
            statusResult.status === "submitted"
          ) {
            console.log(`[StatusJob] Video ${row.id} still processing...`);
          }
        } catch (err) {
          console.error(`[StatusJob] Error checking video ${row.id}:`, err);
        }
      }
    } catch (error) {
      console.error("[StatusJob] Error in status checking job:", error);
    }
  };

  // Check immediately on startup
  checkFn().catch((err) => {
    console.error("[StatusJob] Initial check error:", err);
  });

  // Then check every 30 seconds
  setInterval(checkFn, checkInterval);
  console.log("[StatusJob] Started status checking job (every 30 seconds)");
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

      // Get video record first
      try {
        console.log("[Webhook] Fetching video record for videoId:", videoId);

        const videoResult = await query(
          `SELECT id, image_base64, duration, resolution FROM videos WHERE id = $1`,
          [videoId],
        );

        if (!videoResult.rows[0]) {
          console.error("[Webhook] Video record not found:", videoId);
          return;
        }

        const videoRecord = videoResult.rows[0];
        console.log("[Webhook] ✓ Video record found");

        if (!videoRecord.image_base64) {
          console.error("[Webhook] No image data for video:", videoId);
          return;
        }

        // Trigger video generation
        console.log("[Webhook] Triggering video generation...");

        const protocol =
          process.env.NODE_ENV === "production" ? "https" : "http";
        const host =
          process.env.VERCEL_URL ||
          process.env.API_URL ||
          `localhost:${process.env.PORT || 3000}`;
        const imageUrl = `${protocol}://${host}/api/image/${videoRecord.id}`;

        console.log("[Webhook] Image URL:", imageUrl);

        // Call Fashn AI API to generate video
        const generateResult = await generateVideoWithFashnAI(
          imageUrl,
          videoRecord.duration as 5 | 10,
          videoRecord.resolution as "720p" | "1080p",
        );

        console.log("[Webhook] Generation result:", generateResult);

        if (generateResult.success && generateResult.requestId) {
          console.log(
            "[Webhook] ✓ Video generation started! Request ID:",
            generateResult.requestId,
          );

          // Update database with payment info and request ID
          const updateResult = await query(
            `UPDATE videos
             SET payment_intent_id = $1,
                 payment_status = $2,
                 payment_amount = $3,
                 payment_currency = $4,
                 payment_email = $5,
                 request_id = $6,
                 status = $7
             WHERE id = $8
             RETURNING id, status, request_id, payment_intent_id`,
            [
              paymentIntent.id,
              "succeeded",
              paymentIntent.amount,
              paymentIntent.currency || "usd",
              email || "",
              generateResult.requestId,
              "processing",
              videoId,
            ],
          );

          if (updateResult.rows[0]) {
            console.log(
              "[Webhook] ✓ Database updated successfully:",
              updateResult.rows[0],
            );
          } else {
            console.error("[Webhook] Failed to update database for video");
          }
        } else {
          console.error(
            "[Webhook] ✗ Video generation failed:",
            generateResult.error,
          );

          // Update database with payment info but mark as failed
          await query(
            `UPDATE videos
             SET payment_intent_id = $1,
                 payment_status = $2,
                 payment_amount = $3,
                 payment_currency = $4,
                 payment_email = $5,
                 status = $6,
                 error_message = $7
             WHERE id = $8`,
            [
              paymentIntent.id,
              "succeeded",
              paymentIntent.amount,
              paymentIntent.currency || "usd",
              email || "",
              "failed",
              generateResult.error || "Video generation failed",
              videoId,
            ],
          );
        }
      } catch (dbError) {
        console.error("[Webhook] Database error:", dbError);
      }
    }
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
  }
}
