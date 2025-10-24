import { RequestHandler } from "express";
import Stripe from "stripe";
import { query } from "../db.js";
import { checkAndUpdateAllPendingVideos } from "../services/video-status.js";

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

function verifySignature(body: string, signature: string): StripeEvent {
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

        const email = paymentIntent.metadata?.email;
        if (email) {
          console.log(`Payment succeeded for email: ${email}`);

          try {
            // Find the pending video record for this payment
            const videoResult = await query(
              `SELECT id, resolution, duration, payment_intent_id FROM videos
               WHERE email = $1 AND payment_status = 'payment_pending'
               ORDER BY created_at DESC LIMIT 1`,
              [email],
            );

            if (videoResult.rows.length > 0) {
              const pendingVideo = videoResult.rows[0];
              const resolution = pendingVideo.resolution as "720p" | "1080p";
              const duration = pendingVideo.duration as 5 | 10;

              console.log(
                `Generating video for pending payment: ${pendingVideo.id}`,
              );

              // Get the image from metadata if available
              const imageUrl = paymentIntent.metadata?.imageUrl;
              if (imageUrl) {
                try {
                  // Call video generation API
                  const generateResponse = await fetch(
                    `${process.env.APP_URL || "http://localhost:5173"}/api/generate-video`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        image: imageUrl,
                        duration,
                        resolution,
                        email,
                      }),
                    },
                  );

                  if (generateResponse.ok) {
                    const generateData = await generateResponse.json();
                    const videoUrl = generateData.videoUrl || "";
                    const requestId = generateData.requestId || "";

                    // Update the database with generated video info
                    await query(
                      `UPDATE videos
                       SET payment_intent_id = $1,
                           payment_status = 'succeeded',
                           video_url = $2,
                           request_id = $3,
                           status = $4
                       WHERE id = $5`,
                      [
                        paymentIntent.id,
                        videoUrl || null,
                        requestId || null,
                        videoUrl ? "processing" : "processing",
                        pendingVideo.id,
                      ],
                    );

                    console.log(
                      `Video generation started for payment: ${paymentIntent.id}`,
                    );
                  } else {
                    console.warn("Video generation failed from webhook");
                    // Update payment status but mark video as failed
                    await query(
                      `UPDATE videos
                       SET payment_intent_id = $1,
                           payment_status = 'succeeded',
                           status = 'failed'
                       WHERE id = $2`,
                      [paymentIntent.id, pendingVideo.id],
                    );
                  }
                } catch (generateErr) {
                  console.error("Error generating video in webhook:", generateErr);
                  // Update status to mark failure
                  await query(
                    `UPDATE videos
                     SET payment_intent_id = $1,
                         payment_status = 'succeeded',
                         status = 'failed',
                         error_message = $2
                     WHERE id = $3`,
                    [
                      paymentIntent.id,
                      `Generation error: ${generateErr instanceof Error ? generateErr.message : "Unknown error"}`,
                      pendingVideo.id,
                    ],
                  );
                }
              } else {
                // No image URL in metadata, just update payment status
                await query(
                  `UPDATE videos
                   SET payment_intent_id = $1,
                       payment_status = 'succeeded'
                   WHERE id = $2`,
                  [paymentIntent.id, pendingVideo.id],
                );
              }
            }
          } catch (dbErr) {
            console.error("Error updating database in webhook:", dbErr);
          }
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
      error:
        error instanceof Error ? error.message : "Webhook processing failed",
    });
  }
};
