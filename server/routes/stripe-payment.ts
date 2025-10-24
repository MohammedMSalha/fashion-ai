import { RequestHandler } from "express";

interface PaymentIntentRequest {
  amount: number;
  email: string;
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

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const { amount, email } = req.body as PaymentIntentRequest;

    // Validate required fields
    if (!amount || !email) {
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

    // Get Stripe secret key from environment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return res.status(500).json({
        success: false,
        error: "Service temporarily unavailable",
      });
    }

    // Simulate payment intent creation with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // In production, use Stripe SDK:
    // const stripe = require('stripe')(stripeSecretKey);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount,
    //   currency: 'usd',
    //   metadata: { email }
    // });

    // For now, return a secure mock client secret
    const clientSecret = `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    clearTimeout(timeout);

    return res.status(200).json({
      success: true,
      clientSecret,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Payment intent creation timeout");
      return res.status(504).json({
        success: false,
        error: "Request timeout",
      });
    }
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

    if (!paymentIntentId || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: paymentIntentId, email",
      });
    }

    // In production, verify the payment with Stripe
    // For now, simulate successful payment
    const isSuccessful = true;

    if (!isSuccessful) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
