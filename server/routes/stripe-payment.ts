import { RequestHandler } from "express";
import Stripe from "stripe";

interface PaymentIntentRequest {
  amount: number;
  email: string;
  imageUrl?: string;
  videoId?: number;
  duration?: "5s" | "10s";
  quality?: "720p" | "1080p";
}

interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  error?: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY ||
      "sk_test_51SLjzIFKPN8vxl5YnLIwKGRP9Wze6mSuWc8yA3sMXpU9pvo5xl6q0ZetZboO5gNircXyfu6qc5oTx5KKVLnCszvp00mB0Srdqg";
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripeClient = new Stripe(stripeSecretKey);
  }
  return stripeClient;
}

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const { amount, email, imageUrl, videoId, duration, quality } =
      req.body as PaymentIntentRequest;

    console.log("createPaymentIntent called with:", {
      amount,
      email,
      videoId,
    });
    console.log(
      "STRIPE_SECRET_KEY configured:",
      !!process.env.STRIPE_SECRET_KEY,
    );
    console.log("Environment keys:", {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      database:
        !!process.env.DATABASE_URL || !!process.env.fashion_DATABASE_URL,
    });

    // Validate required fields
    if (!amount || !email) {
      console.log("Missing required fields: amount or email");
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate amount type and range
    if (typeof amount !== "number" || !Number.isInteger(amount)) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount format",
      });
    }

    // Validate amount (minimum $0.50 = 50 cents, maximum $999.99 = 99999 cents)
    if (amount < 50 || amount > 99999) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email",
      });
    }

    try {
      console.log("Getting Stripe client...");
      const stripe = getStripeClient();
      console.log("Stripe client ready, creating payment intent...");

      // Create payment intent with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Stripe API timeout (>10s)")), 10000),
      );

      const paymentIntentPromise = stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          email,
          imageUrl: imageUrl || "",
          videoId: videoId ? String(videoId) : "",
          duration: duration || "",
          quality: quality || "",
        },
      });

      const paymentIntent = await Promise.race([
        paymentIntentPromise,
        timeoutPromise,
      ]);

      console.log("Payment intent created:", (paymentIntent as any).id);
      return res.status(200).json({
        success: true,
        clientSecret: (paymentIntent as any).client_secret,
      });
    } catch (stripeError) {
      console.error("Stripe API error:", stripeError);
      console.error(
        "Error type:",
        stripeError instanceof Error
          ? stripeError.message
          : String(stripeError),
      );

      if (stripeError instanceof Stripe.errors.StripeInvalidRequestError) {
        return res.status(400).json({
          success: false,
          error: stripeError.message,
        });
      }

      if (stripeError instanceof Stripe.errors.StripeAuthenticationError) {
        return res.status(401).json({
          success: false,
          error: "Stripe authentication failed",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Stripe service error",
      });
    }
  } catch (error) {
    console.error("Payment intent error:", error);
    return res.status(500).json({
      success: false,
      error: "Service temporarily unavailable",
    });
  }
};

export const confirmPayment: RequestHandler = async (req, res) => {
  try {
    const { paymentIntentId, email } = req.body;

    // Validate required fields
    if (!paymentIntentId || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate paymentIntentId format (basic check)
    if (typeof paymentIntentId !== "string" || paymentIntentId.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment intent",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email",
      });
    }

    try {
      const stripe = getStripeClient();

      // Retrieve the payment intent from Stripe
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
      });
    } catch (stripeError) {
      console.error("Stripe API error:", stripeError);

      if (stripeError instanceof Stripe.errors.StripeInvalidRequestError) {
        return res.status(400).json({
          success: false,
          error: stripeError.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Stripe service error",
      });
    }
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return res.status(500).json({
      success: false,
      error: "Service temporarily unavailable",
    });
  }
};
