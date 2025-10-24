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

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const { amount, email } = req.body as PaymentIntentRequest;

    // Validate inputs
    if (!amount || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, email",
      });
    }

    // Validate amount is in cents (minimum $0.50 = 50 cents)
    if (amount < 50) {
      return res.status(400).json({
        success: false,
        error: "Amount must be at least $0.50",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Get Stripe secret key from environment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return res.status(500).json({
        success: false,
        error: "Payment service is not configured",
      });
    }

    // Simulate payment intent creation
    // In production, use @stripe/stripe-js on backend:
    // const stripe = require('stripe')(stripeSecretKey);
    // const paymentIntent = await stripe.paymentIntents.create({...})

    // For now, return a mock client secret
    const clientSecret = `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return res.status(200).json({
      success: true,
      clientSecret,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
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
