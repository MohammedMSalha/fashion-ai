import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { generateVideo } from "./routes/video-generation";
import { createPaymentIntent, confirmPayment } from "./routes/stripe-payment";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Video generation endpoint
  app.post("/api/generate-video", generateVideo);

  // Payment endpoints
  app.post("/api/create-payment-intent", createPaymentIntent);
  app.post("/api/confirm-payment", confirmPayment);

  return app;
}
