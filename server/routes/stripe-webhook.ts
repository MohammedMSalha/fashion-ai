import { RequestHandler } from "express";
import Stripe from "stripe";
import { query } from "../db.js";
import {
  checkAndUpdateAllPendingVideos,
  generateVideoAsync,
} from "../services/video-status.js";

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

  console.log("\n[Webhook] ========== WEBHOOK REQUEST RECEIVED ==========");
  console.log("[Webhook] Signature present:", !!signature);

  if (!signature) {
    console.error("[Webhook] ✗ Missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    console.log("[Webhook] Raw body length:", rawBody.length);

    // Verify and parse the event
    let event;
    try {
      event = verifySignature(rawBody, signature);
      console.log("[Webhook] ✓ Signature verified");
      console.log("[Webhook] Event type:", event.type);
    } catch (sigErr) {
      console.error("[Webhook] ✗ Signature verification failed:", sigErr);
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
        console.log(
          "[Webhook]   - All metadata keys:",
          Object.keys(paymentIntent.metadata || {}),
        );

        if (videoId) {
          console.log(`[Webhook] Processing payment for video: ${videoId}`);

          try {
            // Get the video record with image data
            console.log(`[Webhook] Querying video with ID: ${videoId}`);

            const videoIdNum = parseInt(videoId);
            if (isNaN(videoIdNum)) {
              console.error(
                `[Webhook] ✗ Invalid videoId: "${videoId}" is not a number`,
              );
              return;
            }
            console.log(`[Webhook] Parsed videoId as number: ${videoIdNum}`);

            console.log("[Webhook] Executing SELECT query...");
            console.log(
              "[Webhook] Query: SELECT id, image_base64, resolution, duration, status FROM videos WHERE id = $1",
            );
            console.log("[Webhook] Params: [" + videoIdNum + "]");

            const videoResult = await query(
              `SELECT id, image_base64, resolution, duration, status FROM videos
               WHERE id = $1`,
              [videoIdNum],
            );

            console.log(
              `[Webhook] ✓ Query result: ${videoResult.rowCount} rows affected, ${videoResult.rows.length} rows returned`,
            );

            if (videoResult.rows.length === 0) {
              console.error(
                `[Webhook] ✗ Video record NOT found for id=${videoIdNum}`,
              );
              console.error(
                `[Webhook] ✗ This means the video config was not saved before payment`,
              );
              return;
            }

            if (videoResult.rows.length > 0) {
              const videoRecord = videoResult.rows[0];
              console.log("[Webhook] Video record found:");
              console.log("[Webhook]   - id:", videoRecord.id);
              console.log("[Webhook]   - status:", videoRecord.status);
              console.log(
                "[Webhook]   - has image:",
                !!videoRecord.image_base64,
              );
              console.log("[Webhook]   - duration:", videoRecord.duration);
              console.log("[Webhook]   - resolution:", videoRecord.resolution);

              if (
                !["awaiting_payment", "processing"].includes(videoRecord.status)
              ) {
                console.warn(
                  `[Webhook] ⚠ Video status is '${videoRecord.status}', not awaiting_payment or processing`,
                );
              }
              const resolution = videoRecord.resolution as "720p" | "1080p";
              const duration = videoRecord.duration as 5 | 10;
              const imageBase64 = videoRecord.image_base64;

              console.log(
                `Generating video for paid record: ${videoRecord.id}`,
              );

              if (imageBase64) {
                try {
                  // Build image URL that fashion.ai can access
                  // Format: https://domain/api/image/videoId
                  const protocol =
                    process.env.NODE_ENV === "production" ? "https" : "http";
                  const host =
                    process.env.VERCEL_URL ||
                    process.env.API_URL ||
                    `localhost:${process.env.PORT || 3000}`;
                  const imageUrl = `${protocol}://${host}/api/image/${videoRecord.id}`;

                  console.log(
                    `[Webhook] Generating video with image URL: ${imageUrl}`,
                  );

                  // Generate video using the service function
                  const generateResult = await generateVideoAsync(
                    imageUrl,
                    duration,
                    resolution,
                  );

                  console.log(`[Webhook] Generation result:`, generateResult);

                  if (generateResult.success && generateResult.requestId) {
                    console.log(
                      `[Webhook] Generation successful! Request ID: ${generateResult.requestId}`,
                    );

                    // Update the database with generated video info
                    console.log(
                      "[Webhook] Updating database with payment and generation info...",
                    );
                    console.log("[Webhook] UPDATE params:");
                    console.log(
                      "[Webhook]   - payment_intent_id:",
                      paymentIntent.id,
                    );
                    console.log(
                      "[Webhook]   - payment_amount:",
                      paymentIntent.amount,
                    );
                    console.log("[Webhook]   - payment_currency: usd");
                    console.log("[Webhook]   - payment_email:", email);
                    console.log(
                      "[Webhook]   - request_id:",
                      generateResult.requestId,
                    );
                    console.log(
                      "[Webhook]   - video_url:",
                      generateResult.videoUrl,
                    );
                    console.log("[Webhook]   - status: processing");
                    console.log("[Webhook]   - WHERE id:", videoRecord.id);

                    console.log(`[Webhook] Executing UPDATE query...`);
                    console.log(
                      `[Webhook] Parameters: paymentIntentId=${paymentIntent.id}, amount=${paymentIntent.amount}, email=${email}, requestId=${generateResult.requestId}, videoId=${videoRecord.id}`,
                    );

                    try {
                      const updateResult = await query(
                        `UPDATE videos
                         SET payment_intent_id = $1,
                             payment_status = 'succeeded',
                             payment_amount = $2,
                             payment_currency = 'usd',
                             payment_email = $3,
                             video_url = $4,
                             request_id = $5,
                             status = $6
                         WHERE id = $7
                         RETURNING id, request_id, payment_intent_id, status, payment_intent_id, payment_amount, payment_email`,
                        [
                          paymentIntent.id,
                          paymentIntent.amount,
                          email || null,
                          generateResult.videoUrl || null,
                          generateResult.requestId || null,
                          "processing",
                          videoRecord.id,
                        ],
                      );

                      console.log(
                        `[Webhook] UPDATE query result: ${updateResult.rowCount} rows affected`,
                      );

                      if (updateResult.rows[0]) {
                        console.log(
                          `[Webhook] ✓ Database updated successfully:`,
                          JSON.stringify(updateResult.rows[0]),
                        );
                        console.log(
                          `[Webhook] Video generation started for payment: ${paymentIntent.id}`,
                        );

                        // Verify the update by reading back the record
                        console.log(`[Webhook] Verifying database update...`);
                        const verifyResult = await query(
                          `SELECT id, payment_intent_id, payment_amount, payment_currency, payment_email, payment_status, status, request_id FROM videos WHERE id = $1`,
                          [videoRecord.id],
                        );

                        if (verifyResult.rows[0]) {
                          console.log(
                            `[Webhook] ✓ Verification successful:`,
                            JSON.stringify(verifyResult.rows[0]),
                          );
                        } else {
                          console.error(
                            `[Webhook] ✗ Verification failed: record not found after update`,
                          );
                        }
                      } else {
                        console.error(
                          `[Webhook] ✗ UPDATE executed but no rows returned for video: ${videoRecord.id}`,
                        );
                      }
                    } catch (updateErr) {
                      console.error(
                        `[Webhook] ✗ UPDATE query failed:`,
                        updateErr instanceof Error
                          ? updateErr.message
                          : updateErr,
                      );
                      throw updateErr;
                    }
                  } else {
                    console.error(
                      "[Webhook] ✗ Video generation failed:",
                      generateResult.error,
                    );
                    // Update payment status but mark video as failed
                    try {
                      const failResult = await query(
                        `UPDATE videos
                         SET payment_intent_id = $1,
                             payment_status = 'succeeded',
                             payment_amount = $2,
                             payment_currency = 'usd',
                             payment_email = $3,
                             status = $4,
                             error_message = $5
                         WHERE id = $6
                         RETURNING id, payment_intent_id, status, error_message`,
                        [
                          paymentIntent.id,
                          paymentIntent.amount,
                          email || null,
                          "failed",
                          generateResult.error || "Generation failed",
                          videoRecord.id,
                        ],
                      );
                      console.log(
                        "[Webhook] Database updated with generation error:",
                        JSON.stringify(failResult.rows[0]),
                      );
                    } catch (failUpdateErr) {
                      console.error(
                        "[Webhook] ✗ Failed to update database with error:",
                        failUpdateErr instanceof Error
                          ? failUpdateErr.message
                          : failUpdateErr,
                      );
                    }
                  }
                } catch (generateErr) {
                  console.error(
                    "[Webhook] ✗ Error generating video:",
                    generateErr instanceof Error
                      ? generateErr.message
                      : generateErr,
                  );
                  // Update status to mark failure
                  const errMsg =
                    generateErr instanceof Error
                      ? generateErr.message
                      : "Unknown error";
                  try {
                    const catchResult = await query(
                      `UPDATE videos
                       SET payment_intent_id = $1,
                           payment_status = 'succeeded',
                           payment_amount = $2,
                           payment_currency = 'usd',
                           payment_email = $3,
                           status = $4,
                           error_message = $5
                       WHERE id = $6
                       RETURNING id, payment_intent_id, status, error_message`,
                      [
                        paymentIntent.id,
                        paymentIntent.amount,
                        email || null,
                        "failed",
                        `Generation error: ${errMsg}`,
                        videoRecord.id,
                      ],
                    );
                    console.log(
                      "[Webhook] ✓ Database updated after generation error:",
                      JSON.stringify(catchResult.rows[0]),
                    );
                  } catch (dbErr) {
                    console.error(
                      "[Webhook] ✗ Failed to update database after generation error:",
                      dbErr instanceof Error ? dbErr.message : dbErr,
                    );
                  }
                }
              } else {
                console.error(
                  "[Webhook] ✗ No image data for video record:",
                  videoId,
                );
                try {
                  const noImageResult = await query(
                    `UPDATE videos
                     SET payment_intent_id = $1,
                         payment_status = 'succeeded',
                         payment_amount = $2,
                         payment_currency = 'usd',
                         payment_email = $3,
                         status = $4,
                         error_message = $5
                     WHERE id = $6
                     RETURNING id, payment_intent_id, status, error_message`,
                    [
                      paymentIntent.id,
                      paymentIntent.amount,
                      email || null,
                      "failed",
                      "No image data stored",
                      videoRecord.id,
                    ],
                  );
                  console.log(
                    "[Webhook] ✓ Database updated (no image data):",
                    JSON.stringify(noImageResult.rows[0]),
                  );
                } catch (noImageErr) {
                  console.error(
                    "[Webhook] ✗ Failed to update database (no image):",
                    noImageErr instanceof Error
                      ? noImageErr.message
                      : noImageErr,
                  );
                }
              }
            } else {
              console.error(
                `[Webhook] ✗ Video record not found for ID: ${videoId}`,
              );
            }
          } catch (dbErr) {
            console.error(
              "[Webhook] ✗ Database error:",
              dbErr instanceof Error ? dbErr.message : dbErr,
            );
            console.error(
              "[Webhook] Stack trace:",
              dbErr instanceof Error ? dbErr.stack : "No stack trace",
            );
          }
        } else if (email) {
          console.warn(
            "Payment succeeded but no videoId in metadata for email:",
            email,
          );
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
    console.log("\n[Webhook] ========== WEBHOOK COMPLETE ==========");
    console.log("[Webhook] Event processed and stored in database");
    console.log("[Webhook] Check Fly.io logs above for details");
    console.log("[Webhook] =========================================\n");
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "Webhook processing failed",
    });
  }
};
