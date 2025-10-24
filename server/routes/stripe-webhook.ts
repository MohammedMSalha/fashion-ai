import { RequestHandler } from "express";
import Stripe from "stripe";
import { query } from "../db";

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

function getStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(stripeSecretKey);
}

function verifySignature(
  body: string,
  signature: string,
): StripeEvent {
  try {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );

    return event as StripeEvent;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }
}

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    
    // Verify and parse the event
    const event = verifySignature(rawBody, signature);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        
        // Update payment status in database if needed
        const email = paymentIntent.metadata?.email;
        if (email) {
          console.log(`Payment succeeded for email: ${email}`);
          // You can add custom logic here to update payment status in DB
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        
        const email = paymentIntent.metadata?.email;
        if (email) {
          console.log(`Payment failed for email: ${email}`);
          // You can add custom logic here to handle failed payments
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);
        
        const email = charge.metadata?.email;
        if (email) {
          // Delete the generated video if payment is refunded
          try {
            const videoResult = await query(
              `SELECT id FROM videos WHERE email = $1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
              [email],
            );

            if (videoResult.rows.length > 0) {
              const videoId = videoResult.rows[0].id;
              await query(
                `UPDATE videos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [videoId],
              );
              console.log(`Video deleted for refunded payment: ${videoId}`);
            }
          } catch (err) {
            console.error("Error handling refund in database:", err);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Webhook processing failed",
    });
  }
};
