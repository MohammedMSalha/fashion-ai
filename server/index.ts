import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo";
import { generateVideo } from "./routes/video-generation";
import { createPaymentIntent, confirmPayment } from "./routes/stripe-payment";
import { handleStripeWebhook } from "./routes/stripe-webhook";
import { saveVideo, getVideosByEmail, deleteVideo } from "./routes/save-video";
import { initializeDatabase } from "./db";
import { startCleanupJob } from "./jobs/cleanup-videos";

export async function createServer() {
  // Initialize database and cleanup job
  await initializeDatabase();
  startCleanupJob();

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
    max: 10, // limit each IP to 10 requests per hour
    skipSuccessfulRequests: true,
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

  // Video generation endpoint (with stricter rate limiting)
  app.post("/api/generate-video", videoLimiter, generateVideo);

  // Payment endpoints (with stricter rate limiting)
  app.post("/api/create-payment-intent", paymentLimiter, createPaymentIntent);
  app.post("/api/confirm-payment", paymentLimiter, confirmPayment);

  // Video storage endpoints
  app.post("/api/save-video", videoLimiter, saveVideo);
  app.get("/api/videos/:email", getVideosByEmail);
  app.delete("/api/videos/:videoId", deleteVideo);

  return app;
}
