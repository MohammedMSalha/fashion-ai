import { RequestHandler } from "express";
import Stripe from "stripe";

export const createCheckoutSession: RequestHandler = async (req, res) => {
  // Set timeout to 10 seconds max
  const timeout = setTimeout(() => {
    console.error("Checkout request timeout!");
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: "Request timeout" });
    }
  }, 10000);

  try {
    console.log("[Checkout] Received request");

    const { amount, email } = req.body;

    // Quick validation
    if (!amount || !email) {
      clearTimeout(timeout);
      return res.status(400).json({
        success: false,
        error: "Missing amount or email",
      });
    }

    console.log("[Checkout] Validating Stripe key...");
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      clearTimeout(timeout);
      console.error("[Checkout] STRIPE_SECRET_KEY not set");
      return res.status(500).json({
        success: false,
        error: "Payment service not configured",
      });
    }

    console.log("[Checkout] Creating Stripe client...");
    const stripe = new Stripe(stripeKey);

    console.log("[Checkout] Creating checkout session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      success_url: `${req.protocol}://${req.get("host")}/generate?payment=success`,
      cancel_url: `${req.protocol}://${req.get("host")}/generate?payment=cancelled`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "AI Fashion Video",
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
    });

    clearTimeout(timeout);
    console.log("[Checkout] Success! Session:", session.id);

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error(
      "[Checkout] Error:",
      error instanceof Error ? error.message : error,
    );

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};
