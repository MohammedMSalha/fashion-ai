import { RequestHandler } from "express";
import Stripe from "stripe";

interface CheckoutSessionRequest {
  amount: number;
  email: string;
  duration: "5s" | "10s";
  quality: "720p" | "1080p";
  baseUrl?: string;
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

export const createCheckoutSession: RequestHandler = async (req, res) => {
  try {
    console.log("=== Checkout Session Request ===");
    console.log("Body:", req.body);

    const { amount, email, duration, quality, baseUrl } =
      req.body as CheckoutSessionRequest;

    console.log("Parsed:", { amount, email, duration, quality, baseUrl });

    // Validate required fields
    if (!amount || !email) {
      console.error("Missing fields - amount:", amount, "email:", email);
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate amount
    if (typeof amount !== "number" || !Number.isInteger(amount)) {
      console.error("Invalid amount type/format:", typeof amount, amount);
      return res.status(400).json({
        success: false,
        error: "Invalid amount format",
      });
    }

    if (amount < 50 || amount > 99999) {
      console.error("Amount out of range:", amount);
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      console.error("Invalid email:", email);
      return res.status(400).json({
        success: false,
        error: "Invalid email",
      });
    }

    console.log("Validation passed, getting Stripe client...");
    const stripe = getStripeClient();
    console.log("Stripe client initialized");

    const successUrl =
      baseUrl || `${req.protocol}://${req.get("host")}/generate`;
    const cancelUrl =
      baseUrl || `${req.protocol}://${req.get("host")}/generate`;

    console.log("URLs:", { successUrl, cancelUrl });

    // Create checkout session
    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      success_url: `${successUrl}?payment=success&email=${encodeURIComponent(email)}&duration=${duration}&quality=${quality}`,
      cancel_url: `${cancelUrl}?payment=cancelled`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `AI Fashion Video - ${duration} @ ${quality}`,
              description: `Generate a ${duration} AI fashion video in ${quality} quality`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        email,
        duration,
        quality,
      },
    });

    console.log("Session created successfully:", session.id);
    console.log("Checkout URL:", session.url);

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("=== Checkout Session ERROR ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      success: false,
      error: `Failed to create checkout session: ${errorMessage}`,
      details: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
};
