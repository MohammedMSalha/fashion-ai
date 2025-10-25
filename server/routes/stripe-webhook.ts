import { RequestHandler } from "express";
import Stripe from "stripe";
import { query } from "../db.js";
import { generateVideoAsync } from "../services/video-status.js";

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
  body: string | Buffer,
  signature: string,
): StripeEvent {
  try {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    console.log("[Stripe] Verifying webhook signature");
    console.log("[Stripe] Body type:", typeof body);
    console.log("[Stripe] Body is Buffer:", Buffer.isBuffer(body));
    console.log("[Stripe] Body length:", (body as any).length);
    console.log("[Stripe] Signature:", signature.substring(0, 20) + "...");

    const event = stripe.webhooks.constructEvent(
      body as any,
      signature,
      webhookSecret,
    );

    return event as StripeEvent;
  } catch (err) {
    console.error(
      "[Stripe] Verification failed with error:",
      err instanceof Error ? err.message : String(err),
    );
    throw new Error(
      `Webhook signature verification failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  console.log("\n[Webhook] ========== WEBHOOK REQUEST RECEIVED ==========");
  console.log("[Webhook] Timestamp:", new Date().toISOString());
  console.log("[Webhook] Signature present:", !!signature);
  console.log(
    "[Webhook] STRIPE_WEBHOOK_SECRET set:",
    !!process.env.STRIPE_WEBHOOK_SECRET,
  );
  console.log(
    "[Webhook] STRIPE_SECRET_KEY set:",
    !!process.env.STRIPE_SECRET_KEY,
  );

  if (!signature) {
    console.error("[Webhook] ✗ Missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody;

    if (!rawBody) {
      console.error(
        "[Webhook] ✗ No raw body available for signature verification",
      );
      console.error(
        "[Webhook] This usually means express.raw() middleware did not run",
      );
      console.error("[Webhook] req.body type:", typeof req.body);
      console.error(
        "[Webhook] req.body length:",
        JSON.stringify(req.body).length,
      );
      return res.status(400).json({
        error:
          "No raw body for signature verification - webhook middleware misconfiguration",
      });
    }

    console.log("[Webhook] Raw body length:", rawBody.length);
    console.log("[Webhook] Raw body preview:", rawBody.substring(0, 100));

    // Verify and parse the event
    let event;
    try {
      event = verifySignature(rawBody, signature);
      console.log("[Webhook] ✓ Signature verified");
      console.log("[Webhook] Event type:", event.type);
    } catch (sigErr) {
      console.error("[Webhook] ✗ Signature verification failed:", sigErr);
      console.error("[Webhook] Signature header:", signature);
      console.error(
        "[Webhook] Webhook secret env var set:",
        !!process.env.STRIPE_WEBHOOK_SECRET,
      );
      return res.status(400).json({
        error:
          sigErr instanceof Error
            ? sigErr.message
            : "Signature verification failed",
      });
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] =========== PAYMENT SUCCEEDED ===========");
        console.log("[Webhook] Payment ID:", paymentIntent.id);
        console.log("[Webhook] Amount:", paymentIntent.amount, "cents");
        console.log("[Webhook] Currency:", paymentIntent.currency);
        console.log("[Webhook] Metadata:", paymentIntent.metadata);

        const videoId = paymentIntent.metadata?.videoId;
        const email = paymentIntent.metadata?.email;

        console.log("[Webhook] Extracted from metadata:");
        console.log(
          "[Webhook]   - videoId:",
          videoId,
          `(type: ${typeof videoId})`,
        );
        console.log("[Webhook]   - email:", email);

        if (!videoId) {
          console.warn(
            "[Webhook] ⚠ No videoId in metadata. Payment received but no video to update.",
          );
          return res.status(200).json({ received: true });
        }

        // Parse videoId as number
        const videoIdNum = parseInt(videoId);
        if (isNaN(videoIdNum)) {
          console.error(
            `[Webhook] ✗ Invalid videoId: "${videoId}" is not a number`,
          );
          return res.status(200).json({ received: true });
        }

        console.log(`[Webhook] Parsed videoId to number: ${videoIdNum}`);

        // STEP 1: IMMEDIATELY UPDATE DATABASE WITH PAYMENT INFO
        console.log(
          "[Webhook] ========== STEP 1: STORE PAYMENT INFO IN DATABASE ==========",
        );
        try {
          const paymentUpdateResult = await query(
            `UPDATE videos
             SET payment_intent_id = $1,
                 payment_status = $2,
                 payment_amount = $3,
                 payment_currency = $4,
                 payment_email = $5,
                 status = $6
             WHERE id = $7
             RETURNING id, payment_intent_id, payment_status, payment_amount, payment_email`,
            [
              paymentIntent.id,
              "succeeded",
              paymentIntent.amount,
              paymentIntent.currency || "usd",
              email || "",
              "processing",
              videoIdNum,
            ],
          );

          console.log(
            `[Webhook] UPDATE result: ${paymentUpdateResult.rowCount} rows affected`,
          );

          if (paymentUpdateResult.rows.length === 0) {
            console.error(
              `[Webhook] ✗ Video NOT FOUND for id=${videoIdNum} - DB not updated`,
            );
            console.error(
              "[Webhook] This could mean: video config was never saved, or videoId doesn't match",
            );
            return res.status(200).json({ received: true });
          }

          const paymentRecord = paymentUpdateResult.rows[0];
          console.log(
            "[Webhook] ✓ PAYMENT DATA STORED SUCCESSFULLY:",
            JSON.stringify(paymentRecord),
          );
        } catch (paymentErr) {
          console.error(
            "[Webhook] ✗ ERROR updating payment info:",
            paymentErr instanceof Error ? paymentErr.message : paymentErr,
          );
          return res.status(200).json({ received: true });
        }

        // STEP 2: FETCH VIDEO RECORD FOR GENERATION
        console.log(
          "[Webhook] ========== STEP 2: FETCH VIDEO FOR GENERATION ==========",
        );
        try {
          const videoResult = await query(
            `SELECT id, image_base64, resolution, duration, status FROM videos WHERE id = $1`,
            [videoIdNum],
          );

          if (videoResult.rows.length === 0) {
            console.error(
              `[Webhook] ✗ Video record not found (this is odd, we just updated it!)`,
            );
            return res.status(200).json({ received: true });
          }

          const videoRecord = videoResult.rows[0];
          console.log("[Webhook] Video record found:");
          console.log("[Webhook]   - id:", videoRecord.id);
          console.log("[Webhook]   - status:", videoRecord.status);
          console.log("[Webhook]   - has image:", !!videoRecord.image_base64);
          console.log("[Webhook]   - duration:", videoRecord.duration);
          console.log("[Webhook]   - resolution:", videoRecord.resolution);

          if (!videoRecord.image_base64) {
            console.error(
              "[Webhook] ✗ No image data stored. Cannot generate video.",
            );
            return res.status(200).json({ received: true });
          }

          // STEP 3: TRIGGER VIDEO GENERATION
          console.log(
            "[Webhook] ========== STEP 3: TRIGGER VIDEO GENERATION ==========",
          );

          // Pass base64 image directly to fashion.ai
          console.log(
            "[Webhook] Using base64 image (length:",
            videoRecord.image_base64.length,
            "bytes)",
          );

          const generateResult = await generateVideoAsync(
            videoRecord.image_base64,
            videoRecord.duration as 5 | 10,
            videoRecord.resolution as "720p" | "1080p",
          );

          console.log(
            "[Webhook] Generation result:",
            JSON.stringify(generateResult),
          );

          if (generateResult.success && generateResult.requestId) {
            console.log(
              "[Webhook] ✓ Video generation started! Request ID:",
              generateResult.requestId,
            );

            // Update with request ID
            try {
              const genUpdateResult = await query(
                `UPDATE videos
                 SET request_id = $1
                 WHERE id = $2
                 RETURNING id, request_id`,
                [generateResult.requestId, videoIdNum],
              );

              console.log(
                "[Webhook] ✓ Request ID stored in database:",
                JSON.stringify(genUpdateResult.rows[0]),
              );
            } catch (genErr) {
              console.error(
                "[Webhook] ✗ Error storing request ID:",
                genErr instanceof Error ? genErr.message : genErr,
              );
            }
          } else {
            console.error(
              "[Webhook] ✗ Video generation failed:",
              generateResult.error,
            );

            // Update status to failed
            try {
              await query(
                `UPDATE videos SET status = $1, error_message = $2 WHERE id = $3`,
                [
                  "failed",
                  generateResult.error || "Generation failed",
                  videoIdNum,
                ],
              );
              console.log("[Webhook] ✓ Status updated to failed");
            } catch (failErr) {
              console.error(
                "[Webhook] ✗ Error updating status:",
                failErr instanceof Error ? failErr.message : failErr,
              );
            }
          }
        } catch (dbErr) {
          console.error(
            "[Webhook] ✗ Database error during generation step:",
            dbErr instanceof Error ? dbErr.message : dbErr,
          );
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] ✗ Payment FAILED:", paymentIntent.id);

        const email = paymentIntent.metadata?.email;
        if (email) {
          console.log(`[Webhook] Failed payment for email: ${email}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("[Webhook] Charge REFUNDED:", charge.id);

        const email = charge.metadata?.email;
        if (email) {
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
              console.log(
                `[Webhook] ✓ Video marked as deleted after refund: ${videoId}`,
              );
            }
          } catch (err) {
            console.error("[Webhook] Error handling refund in database:", err);
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Always acknowledge receipt of the event
    console.log("\n[Webhook] ========== WEBHOOK COMPLETE ==========");
    console.log("[Webhook] Event processed successfully");
    console.log("[Webhook] Check logs above for details");
    console.log("[Webhook] =========================================\n");

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Webhook] ✗ CRITICAL ERROR:", error);
    console.error(
      "[Webhook] Stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    return res.status(200).json({ received: true });
  }
};
