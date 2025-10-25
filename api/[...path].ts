import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "../server/routes/demo";
import { generateVideo } from "../server/routes/video-generation";
import {
  createPaymentIntent,
  confirmPayment,
} from "../server/routes/stripe-payment";
import { createCheckoutSession } from "../server/routes/stripe-checkout";
import { handleStripeWebhook } from "../server/routes/stripe-webhook";
import {
  saveVideo,
  saveVideoConfig,
  getVideosByEmail,
  deleteVideo,
  getVideoStatus,
} from "../server/routes/save-video";
import { checkPendingVideos } from "../server/routes/check-pending-videos";
import { getImageByVideoId } from "../server/routes/image-server";
import {
  getSMTPStatusHandler,
  sendCodeHandler,
  verifyCodeHandler,
} from "../server/routes/email-auth";
import { initializeDatabase } from "../server/db";
import { startCleanupJob } from "../server/jobs/cleanup-videos";
import { startVideoStatusCheckJob } from "../server/jobs/check-video-status";

let expressApp: express.Express | null = null;
let serverlessHandler: any = null;
let initPromise: Promise<express.Express> | null = null;

async function createApp(): Promise<express.Express> {
  // Initialize database and background jobs
  await initializeDatabase();
  startCleanupJob();
  startVideoStatusCheckJob();

  const app = express();

  // Trust proxy - required for Vercel
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

  // Stripe webhook handler - MUST be before body parsing
  const stripeWebhookMiddleware = (req: any, res: any, next: any) => {
    console.log("[Webhook] POST /api/webhook/stripe received");
    console.log("[Webhook] Headers:", req.headers);

    // Preserve raw body for Stripe signature verification
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

    next();
  };

  app.post("/api/webhook/stripe", stripeWebhookMiddleware, handleStripeWebhook);

  // Request size limits
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", limiter);

  const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    skipSuccessfulRequests: false,
    message: "Too many payment requests, please try again later",
  });

  const videoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
  });

  // Routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      stripe_key_set: !!process.env.STRIPE_SECRET_KEY,
      db_url_set: !!(
        process.env.DATABASE_URL || process.env.fashion_DATABASE_URL
      ),
    });
  });

  app.post("/api/generate-video", videoLimiter, generateVideo);

  app.post("/api/create-payment-intent", paymentLimiter, createPaymentIntent);
  app.post("/api/confirm-payment", paymentLimiter, confirmPayment);
  app.post("/api/checkout-session", paymentLimiter, createCheckoutSession);

  app.post("/api/save-video-config", videoLimiter, saveVideoConfig);
  app.post("/api/save-video", videoLimiter, saveVideo);
  app.get("/api/videos/:email", getVideosByEmail);
  app.get("/api/video-status/:videoId", getVideoStatus);
  app.get("/api/check-pending/:email", checkPendingVideos);
  app.delete("/api/videos/:videoId", deleteVideo);

  app.get("/api/image/:videoId", getImageByVideoId);

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

  // Global error handler
  app.use(
    (
      err: any,
      _req: express.Request,
      res: any,
      _next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);

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

async function getServerlessHandler(): Promise<any> {
  if (serverlessHandler) return serverlessHandler;
  if (initPromise) {
    expressApp = await initPromise;
  } else {
    initPromise = createApp();
    expressApp = await initPromise;
  }

  // Wrap Express app with serverless-http
  serverlessHandler = serverless(expressApp);
  return serverlessHandler;
}

export default async function handler(req: any, res: any) {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    console.log(`[Serverless] ${req.method} ${pathname}`);

    const app = await getExpressApp();

    // Preserve raw body for Stripe webhook before any parsing
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request detected");

      if (typeof req.body === "string") {
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        req.rawBody = JSON.stringify(req.body);
      } else {
        req.rawBody = "";
      }

      console.log("[Serverless] rawBody length:", req.rawBody?.length || 0);
    }

    // Pass request to Express app
    return new Promise<void>((resolve) => {
      const originalEnd = res.end.bind(res);

      res.end = function (...args: any[]) {
        originalEnd(...args);
        resolve();
      };

      app(req, res);
    });
  } catch (error) {
    console.error("[Serverless] Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Server initialization failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
