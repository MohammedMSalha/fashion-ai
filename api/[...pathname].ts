import { Pool } from "pg";
import Stripe from "stripe";
import nodemailer from "nodemailer";

let pool: Pool | null = null;
let stripeClient: Stripe | null = null;

// In-memory storage for verification codes
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: number; attempts: number }
>();

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const DATABASE_URL =
    process.env.DATABASE_URL || process.env.fashion_DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not set");
  }

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  });

  return pool;
}

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const key =
      process.env.STRIPE_SECRET_KEY ||
      "sk_test_51SLjzIFKPN8vxl5YnLIwKGRP9Wze6mSuWc8yA3sMXpU9pvo5xl6q0ZetZboO5gNircXyfu6qc5oTx5KKVLnCszvp00mB0Srdqg";
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function query(sql: string, params?: any[]) {
  const pg = getPool();
  return await pg.query(sql, params);
}

function isSMTPConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getMailTransporter() {
  if (!isSMTPConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

async function parseRequestBody(req: any): Promise<any> {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  return req.body || {};
}

async function handler(req: any, res: any) {
  // Capture raw body for Stripe webhook
  if (req.url?.includes("/api/stripe-webhook")) {
    const chunks: any[] = [];
    let rawBodyBuffer: Buffer;

    // If body is already parsed (Vercel), reconstruct it
    if (typeof req.body === "object") {
      rawBodyBuffer = Buffer.from(JSON.stringify(req.body));
    } else if (typeof req.body === "string") {
      rawBodyBuffer = Buffer.from(req.body);
    } else if (Buffer.isBuffer(req.body)) {
      rawBodyBuffer = req.body;
    } else {
      rawBodyBuffer = Buffer.from("");
    }

    req.rawBody = rawBodyBuffer.toString("utf-8");
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Stripe-Signature",
  );
  res.setHeader("Cache-Control", "no-store");

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url || "", "http://localhost");
    const pathname = url.pathname;

    console.log("[API]", req.method, pathname);

    // ============ HEALTH CHECK ============
    if (pathname === "/api/health") {
      return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    // ============ EMAIL AUTH - SEND CODE ============
    if (pathname === "/api/auth/send-code" && req.method === "POST") {
      const body = await parseRequestBody(req);
      const { email } = body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email" });
      }

      if (!isSMTPConfigured()) {
        return res.status(200).json({ success: true, requiresCode: false });
      }

      try {
        const code = generateCode();
        const expiresAt = Date.now() + 15 * 60 * 1000;
        verificationCodes.set(email, { code, expiresAt, attempts: 0 });

        const transporter = await getMailTransporter();
        if (transporter) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: "Fashion AI - Verification Code",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Verify Your Email</h2>
                <p>Your verification code is:</p>
                <h1 style="font-size: 48px; letter-spacing: 10px; color: #000; margin: 30px 0;">${code}</h1>
                <p>This code expires in 15 minutes.</p>
              </div>
            `,
          });
        }

        return res.status(200).json({ success: true, requiresCode: true });
      } catch (error) {
        console.error("Send code error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to send verification code",
        });
      }
    }

    // ============ EMAIL AUTH - VERIFY CODE ============
    if (pathname === "/api/auth/verify-code" && req.method === "POST") {
      const body = await parseRequestBody(req);
      const { email, code } = body;

      if (!email || !code) {
        return res
          .status(400)
          .json({ success: false, error: "Email and code required" });
      }

      const stored = verificationCodes.get(email);
      if (!stored) {
        return res.status(400).json({
          success: false,
          error: "No verification code found",
        });
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(email);
        return res.status(400).json({
          success: false,
          error: "Code expired",
        });
      }

      stored.attempts++;
      if (stored.attempts > 5) {
        verificationCodes.delete(email);
        return res.status(400).json({
          success: false,
          error: "Too many attempts",
        });
      }

      if (stored.code !== code) {
        return res.status(400).json({
          success: false,
          error: "Invalid code",
        });
      }

      verificationCodes.delete(email);
      return res.status(200).json({ success: true });
    }

    // ============ AUTH - SMTP STATUS ============
    if (pathname === "/api/auth/smtp-status" && req.method === "GET") {
      const configured = isSMTPConfigured();
      return res.status(200).json({
        success: true,
        enabled: configured,
        requiresVerification: configured,
      });
    }

    // ============ CREATE PAYMENT INTENT ============
    if (pathname === "/api/create-payment-intent" && req.method === "POST") {
      const body = await parseRequestBody(req);
      const { amount, email, videoId, duration, quality } = body;

      console.log("[Payment] Creating intent:", { amount, email, videoId });

      if (!amount || !email || !videoId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      try {
        const stripe = getStripeClient();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount),
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          metadata: {
            email,
            videoId: String(videoId),
            duration: String(duration || ""),
            quality: String(quality || ""),
          },
        });

        return res.status(200).json({
          success: true,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Payment intent error:", error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Payment error",
        });
      }
    }

    // ============ CREATE CHECKOUT SESSION ============
    if (pathname === "/api/checkout-session" && req.method === "POST") {
      const body = await parseRequestBody(req);
      const { amount, email, videoId, duration, quality } = body;

      if (!amount || !email) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      try {
        const stripe = getStripeClient();
        const protocol =
          req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host =
          req.headers["x-forwarded-host"] || req.headers.host || "localhost";
        const baseUrl = `${protocol}://${host}`;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: email,
          success_url: `${baseUrl}/generate?payment=success`,
          cancel_url: `${baseUrl}/generate?payment=cancelled`,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: "Video Generation" },
                unit_amount: Math.round(amount),
              },
              quantity: 1,
            },
          ],
          metadata: {
            videoId: String(videoId || ""),
            email,
            duration: String(duration || ""),
            quality: String(quality || ""),
          },
        });

        return res.status(200).json({
          success: true,
          sessionId: session.id,
          url: session.url,
        });
      } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Checkout error",
        });
      }
    }

    // ============ STRIPE WEBHOOK ============
    if (pathname === "/api/stripe-webhook" && req.method === "POST") {
      const signature = req.headers["stripe-signature"] as string;
      const rawBody = req.rawBody || JSON.stringify(req.body);

      if (!signature) {
        console.error("[Webhook] Missing signature");
        console.error("[Webhook] Available headers:", Object.keys(req.headers));
        return res.status(400).json({ error: "Missing signature" });
      }

      try {
        const stripe = getStripeClient();
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
          console.error("[Webhook] Secret not configured");
          console.error("[Webhook] STRIPE_WEBHOOK_SECRET env var not set");
          // For development, we might not have the webhook secret, so just log the event
          console.log("[Webhook] Event payload:", rawBody.substring(0, 200));
          const bodyObj =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          console.log("[Webhook] Event type:", bodyObj?.type);
          return res
            .status(200)
            .json({ received: true, warning: "No webhook secret configured" });
        }

        console.log("[Webhook] Verifying signature with secret...");
        const event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );

        console.log("[Webhook] Event:", event.type);

        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object as any;
          const videoId = parseInt(paymentIntent.metadata?.videoId);
          const email = paymentIntent.metadata?.email;

          console.log("[Webhook] Payment succeeded:", { videoId, email });

          if (videoId && !isNaN(videoId)) {
            // Update database with payment info
            const updateResult = await query(
              `UPDATE videos
               SET payment_intent_id = $1,
                   payment_status = $2,
                   payment_amount = $3,
                   payment_currency = $4,
                   payment_email = $5,
                   status = $6
               WHERE id = $7
               RETURNING id`,
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

            if (updateResult.rows.length > 0) {
              console.log("[Webhook] Payment stored for video:", videoId);
            } else {
              console.warn("[Webhook] Video not found:", videoId);
            }
          }
        }

        return res.status(200).json({ received: true });
      } catch (error) {
        console.error("[Webhook] Error:", error);
        return res.status(200).json({ received: true });
      }
    }

    // ============ SAVE VIDEO CONFIG ============
    if (pathname === "/api/save-video-config") {
      if (req.method === "GET") {
        const emailParam = url.searchParams.get("email") || undefined;
        const limitParam = url.searchParams.get("limit");
        const includeImage = url.searchParams.get("includeImage") === "true";

        if (emailParam && !validateEmail(emailParam)) {
          return res.status(400).json({
            success: false,
            error: "Invalid email",
          });
        }

        const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
        const hasValidLimit = Number.isFinite(parsedLimit ?? Number.NaN);
        const limit = hasValidLimit
          ? Math.min(Math.max((parsedLimit as number), 1), 50)
          : 20;

        const params: Array<string | number> = [];
        let whereClause = "";

        if (emailParam) {
          params.push(emailParam);
          whereClause = "WHERE email = $1";
        }

        const selectColumns = [
          "id",
          "email",
          "duration",
          "resolution",
          "status",
          "created_at",
          "expires_at",
        ];

        if (includeImage) {
          selectColumns.push("image_base64");
        }

        const result = await query(
          `SELECT ${selectColumns.join(", ")}
           FROM videos
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $${params.length + 1}`,
          [...params, limit],
        );

        const configs = result.rows.map((row: any) => {
          const config: Record<string, unknown> = {
            id: row.id,
            email: row.email,
            duration: row.duration,
            resolution: row.resolution,
            status: row.status,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
          };

          if (includeImage && row.image_base64) {
            config.imageBase64 = row.image_base64;
          }

          return config;
        });

        return res.status(200).json({
          success: true,
          configs,
          limit,
          email: emailParam,
        });
      }

      if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed. Use GET or POST.`,
        });
      }

      const body = await parseRequestBody(req);
      const { email, imageBase64, duration, resolution } = body;

      if (!email || !imageBase64 || !duration || !resolution) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email",
        });
      }

      if (![5, 10].includes(duration)) {
        return res.status(400).json({
          success: false,
          error: "Invalid duration",
        });
      }

      if (!["720p", "1080p"].includes(resolution)) {
        return res.status(400).json({
          success: false,
          error: "Invalid resolution",
        });
      }

      try {
        const result = await query(
          `INSERT INTO videos (email, image_base64, duration, resolution, status)
           VALUES ($1, $2, $3, $4, 'awaiting_payment')
           RETURNING id, created_at, expires_at`,
          [email, imageBase64, duration, resolution],
        );

        const videoRecord = result.rows[0];
        return res.status(200).json({
          success: true,
          videoId: videoRecord.id,
          status: "awaiting_payment",
          createdAt: videoRecord.created_at,
        });
      } catch (error) {
        console.error("Save config error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to save config",
        });
      }
    }

    // ============ GET VIDEOS ============
    if (
      pathname.startsWith("/api/videos/") &&
      req.method === "GET" &&
      !pathname.includes("/api/videos/DELETE")
    ) {
      const email = decodeURIComponent(pathname.split("/api/videos/")[1]);

      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email",
        });
      }

      try {
        const result = await query(
          `SELECT id, email, video_url, duration, resolution, status, error_message, created_at, expires_at, request_id,
                  payment_intent_id, payment_amount, payment_currency, payment_status, payment_email
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
      } catch (error) {
        console.error("Get videos error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch videos",
        });
      }
    }

    // ============ DELETE VIDEO ============
    if (pathname.startsWith("/api/videos/") && req.method === "DELETE") {
      const videoId = decodeURIComponent(pathname.split("/api/videos/")[1]);

      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: "Video ID required",
        });
      }

      try {
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
      } catch (error) {
        console.error("Delete video error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to delete video",
        });
      }
    }

    // ============ CHECK PENDING VIDEOS ============
    if (pathname.startsWith("/api/check-pending/") && req.method === "GET") {
      const email = decodeURIComponent(
        pathname.split("/api/check-pending/")[1],
      );

      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email",
        });
      }

      try {
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
      } catch (error) {
        console.error("Check pending error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to check pending",
        });
      }
    }

    // ============ GET VIDEO STATUS ============
    if (pathname.startsWith("/api/video-status/") && req.method === "GET") {
      const videoId = decodeURIComponent(
        pathname.split("/api/video-status/")[1],
      );

      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: "Video ID required",
        });
      }

      try {
        const result = await query(
          `SELECT id, status, video_url, error_message FROM videos WHERE id = $1`,
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
          video: result.rows[0],
        });
      } catch (error) {
        console.error("Get status error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to get status",
        });
      }
    }

    // ============ 404 ============
    return res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path: pathname,
    });
  } catch (error) {
    console.error("[API] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      });
    }
  }
}

export default handler;
