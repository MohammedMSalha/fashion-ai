import "dotenv/config";
import express from "express";
import cors from "cors";
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
import { initializeDatabase } from "./db.js";
import { startCleanupJob } from "./jobs/cleanup-videos.js";
import { startVideoStatusCheckJob } from "./jobs/check-video-status.js";

export async function createServer() {
  // Initialize database and background jobs
  await initializeDatabase();
  startCleanupJob();
  startVideoStatusCheckJob();

  const app = express();

  // Trust proxy - required for Vercel and other reverse proxies that set X-Forwarded-For
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    }),
  );

  // Log all incoming requests (for debugging)
  app.use((req, res, next) => {
    console.log(`[Express] ${req.method} ${req.path} ${req.url}`);
    next();
  });

  // Stripe webhook handler - MUST be before any other middleware
  // This needs to handle raw body for signature verification
  app.post("/api/webhook/stripe", async (req: any, res: any, next: any) => {
    console.log("[Webhook] POST /api/webhook/stripe received");
    console.log("[Webhook] Headers:", req.headers);

    // The raw body should already be set by the serverless wrapper
    if (!req.rawBody) {
      console.log("[Webhook] Setting rawBody from req.body");
      if (typeof req.body === "string") {
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString("utf-8");
      } else {
        req.rawBody = JSON.stringify(req.body);
      }
    }

    // Call the webhook handler
    await handleStripeWebhook(req, res, next);
  });

  // Request size limits
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

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
    });
  });

  // Video generation endpoint (with stricter rate limiting)
  app.post("/api/generate-video", videoLimiter, generateVideo);

  // Payment endpoints (with stricter rate limiting)
  app.post("/api/create-payment-intent", paymentLimiter, createPaymentIntent);
  app.post("/api/confirm-payment", paymentLimiter, confirmPayment);
  app.post("/api/checkout-session", paymentLimiter, createCheckoutSession);

  // Video storage endpoints
  app.post("/api/save-video-config", videoLimiter, saveVideoConfig);
  app.post("/api/save-video", videoLimiter, saveVideo);
  app.get("/api/videos/:email", getVideosByEmail);
  app.get("/api/video-status/:videoId", getVideoStatus);
  app.get("/api/check-pending/:email", checkPendingVideos);
  app.delete("/api/videos/:videoId", deleteVideo);

  // Image serving endpoint (for fashion.ai to access images)
  app.get("/api/image/:videoId", getImageByVideoId);

  // Email authentication endpoints
  app.get("/api/auth/smtp-status", getSMTPStatusHandler);
  app.post("/api/auth/send-code", sendCodeHandler);
  app.post("/api/auth/verify-code", verifyCodeHandler);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
    });
  });

  // Global error handler (must be last)
  app.use(
    (
      err: any,
      _req: express.Request,
      res: any,
      _next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);

      // Ensure we always return JSON
      const statusCode = err.statusCode || err.status || 500;
      const message =
        err.message || "An unexpected error occurred. Please try again.";

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    },
  );

  return app;
}
