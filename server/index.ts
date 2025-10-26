import "dotenv/config";
import path from "path";
import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo.js";
import { generateVideo } from "./routes/video-generation.js";
import {
  createPaymentIntent,
  confirmPayment,
} from "./routes/stripe-payment.js";
import { createCheckoutSession } from "./routes/stripe-checkout.js";
import { handleStripeWebhook } from "./routes/stripe-webhook.js";
import {
  saveVideo,
  saveVideoConfig,
  listVideoConfigs,
  getVideosByEmail,
  deleteVideo,
  getVideoStatus,
} from "./routes/save-video.js";
import { checkPendingVideos } from "./routes/check-pending-videos.js";
import { getImageByVideoId } from "./routes/image-server.js";
import {
  getSMTPStatusHandler,
  sendCodeHandler,
  verifyCodeHandler,
} from "./routes/email-auth.js";
import { cronCheckVideoStatus } from "./routes/cron-video-status.js";
import { initializeDatabase } from "./db.js";
import { startCleanupJob } from "./jobs/cleanup-videos.js";
import { startVideoStatusCheckJob } from "./jobs/check-video-status.js";

export async function createServer() {
  console.log("[Express] Creating server...");

  // Initialize database and background jobs
  try {
    await initializeDatabase();
    console.log("[Express] Database initialized");
  } catch (error) {
    console.error("[Express] Database init failed:", error);
  }

  // On Vercel, background jobs don't work reliably in serverless
  // Vercel Crons will trigger endpoints instead
  if (!process.env.VERCEL) {
    try {
      startCleanupJob();
      console.log("[Express] Cleanup job started");
    } catch (error) {
      console.error("[Express] Cleanup job failed:", error);
    }

    try {
      startVideoStatusCheckJob();
      console.log("[Express] Video status job started");
    } catch (error) {
      console.error("[Express] Video status job failed:", error);
    }
  } else {
    console.log(
      "[Express] Vercel serverless detected - background jobs disabled (use Vercel Crons instead)",
    );
  }

  const app = express();
  console.log("[Express] Express app created");

  // Trust proxy - required for Vercel and other reverse proxies that set X-Forwarded-For
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions: CorsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.options(/\/api\/.*/, cors(corsOptions));

  // Stripe webhook handler - MUST be FIRST and use raw body middleware
  // This captures the raw bytes BEFORE any JSON parsing
  app.post(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    (req: any, res: any, next: any) => {
      // Convert Buffer to string for Stripe SDK
      if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "string") {
        req.rawBody = req.body;
      } else {
        req.rawBody = JSON.stringify(req.body);
      }

      console.log("[Webhook] Raw body captured, length:", req.rawBody.length);
      next();
    },
    handleStripeWebhook,
  );

  // Request size limits - MUST be after webhook route!
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Email authentication endpoints - BEFORE rate limiting
  console.log("[Express] Registering auth endpoints (before rate limiting)");
  app.get("/api/auth/smtp-status", getSMTPStatusHandler);
  app.post("/api/auth/send-code", sendCodeHandler);
  app.post("/api/auth/verify-code", verifyCodeHandler);
  console.log(
    "[Express] Auth endpoints registered: /api/auth/smtp-status, /api/auth/send-code, /api/auth/verify-code",
  );

  // Vercel Cron endpoint for video status checking - BEFORE rate limiting
  // Vercel will call this endpoint on a schedule (see vercel.json)
  app.get("/api/cron/check-video-status", cronCheckVideoStatus);
  // Manual trigger for video status checking (can be called by external cron service)
  app.get("/api/check-video-status", cronCheckVideoStatus);
  console.log(
    "[Express] Cron endpoints registered: /api/cron/check-video-status, /api/check-video-status",
  );

  // Disable caching for API endpoints
  app.use("/api/", (req, res, next) => {
    res.setHeader(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Log all incoming requests (for debugging)
  app.use((req, res, next) => {
    console.log(`[Express] ${req.method} ${req.path} ${req.url}`, {
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
    });
    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all API routes
  app.use("/api/", limiter);

  // Stricter rate limiting for payment and video generation
  const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each IP to 50 requests per hour (for testing)
    skipSuccessfulRequests: false, // Count all requests
    message: "Too many payment requests, please try again later",
  });

  const videoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per hour
    skipSuccessfulRequests: true,
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Health check endpoint (no rate limiting)
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      stripe_key_set: !!process.env.STRIPE_SECRET_KEY,
      db_url_set: !!(
        process.env.DATABASE_URL || process.env.fashion_DATABASE_URL
      ),
      background_job_active: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Video generation endpoint (with stricter rate limiting)
  app.post("/api/generate-video", videoLimiter, generateVideo);

  // Payment endpoints (with stricter rate limiting)
  app.post("/api/create-payment-intent", paymentLimiter, createPaymentIntent);
  app.post("/api/confirm-payment", paymentLimiter, confirmPayment);
  app.post("/api/checkout-session", paymentLimiter, createCheckoutSession);

  // Video storage endpoints
  app
    .route("/api/save-video-config")
    .post(videoLimiter, saveVideoConfig)
    .get(videoLimiter, listVideoConfigs)
    .all((req, res) => {
      res
        .status(405)
        .setHeader("Allow", "GET, POST")
        .json({
          success: false,
          error: `Method ${req.method} not allowed. Use GET or POST.`,
        });
    });
  app.post("/api/save-video", videoLimiter, saveVideo);
  // Test endpoint to verify Express is running
  app.get("/api/test", (_req, res) => {
    res.json({ status: "ok", message: "Express is running" });
  });

  // Test route with parameter to verify parameter matching
  app.get("/api/test-param/:id", (req, res) => {
    res.json({ status: "ok", message: "Param route works", id: req.params.id });
  });

  app.post("/api/videos", videoLimiter, getVideosByEmail);
  app.get("/api/video-status/:videoId", getVideoStatus);
  app.post("/api/video-status/:videoId", getVideoStatus);
  app.post("/api/check-pending", videoLimiter, checkPendingVideos);
  app.delete("/api/videos/:videoId", deleteVideo);

  // Image serving endpoint (for fashion.ai to access images)
  app.get("/api/image/:videoId", getImageByVideoId);

  // Global error handler (must be before catch-all)
  app.use(
    (
      err: any,
      _req: express.Request,
      res: any,
      _next: express.NextFunction,
    ) => {
      console.error("[ErrorHandler]", err);
      if (!res.headersSent) {
        res.status(err.status || 500).json({
          success: false,
          error: err.message || "Internal server error",
        });
      }
    },
  );

  // Catch-all handler for 404s (MUST be last)
  app.use((req, res) => {
    console.log("[NotFound]", req.method, req.path);
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path: req.path,
    });
  });

  // Only add static file serving and SPA fallback for local development
  // Skip in serverless environment - Vercel handles static files separately
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    try {
      const distPath = path.join(import.meta.dirname, "../spa");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } catch (error) {
      console.warn(
        "[Express] Could not set up static file serving:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    "[Express] Server created successfully with all routes registered",
  );
  return app;
}
