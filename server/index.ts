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
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Stripe webhook handler (MUST be before JSON body parser)
  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    (req: any, res: any, next: any) => {
      // Store raw body for Stripe signature verification
      req.rawBody = req.body;
      next();
    },
    handleStripeWebhook,
  );

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
  app.post("/api/save-video", videoLimiter, saveVideo);
  app.get("/api/videos/:email", getVideosByEmail);
  app.get("/api/video-status/:videoId", getVideoStatus);
  app.get("/api/check-pending/:email", checkPendingVideos);
  app.delete("/api/videos/:videoId", deleteVideo);

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
