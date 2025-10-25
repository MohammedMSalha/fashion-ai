import { RequestHandler } from "express";
import Stripe from "stripe";

export const createCheckoutSession: RequestHandler = async (req, res) => {
  try {
    console.log("=== CHECKOUT SESSION START ===");
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    const { amount, email, duration, quality, baseUrl } = req.body;

    console.log("Parsed checkout request:", {
      amount,
      email,
      duration,
      quality,
    });

    // Validate required fields
    if (!amount || !email) {
      console.error("Missing fields:", { amount, email });
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        success: false,
        error: "Missing amount or email",
      });
    }

    // Check Stripe secret key
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY not set in environment variables");
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: "Payment service not configured",
      });
    }

    console.log("✓ STRIPE_SECRET_KEY is set");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey);
    console.log("✓ Stripe client initialized");

    // Build return URLs
    const baseURL = baseUrl || `${req.protocol}://${req.get("host")}`;
    const successUrl = `${baseURL}/generate?payment=success`;
    const cancelUrl = `${baseURL}/generate?payment=cancelled`;

    console.log("Creating session with URLs:", { successUrl, cancelUrl });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `AI Fashion Video`,
              description: `Duration: ${duration || "5s"}, Quality: ${quality || "1080p"}`,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      metadata: {
        email,
        duration: String(duration || "5s"),
        quality: String(quality || "1080p"),
      },
    });

    console.log("✓ Session created:", session.id);
    console.log("✓ Checkout URL:", session.url);

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("❌ Stripe error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    });
  }
};
