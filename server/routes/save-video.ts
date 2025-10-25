import { RequestHandler } from "express";
import { query } from "../db.js";

interface SaveVideoRequest {
  email: string;
  videoUrl?: string;
  videoId?: string;
  requestId?: string;
  duration: 5 | 10;
  resolution: "720p" | "1080p";
  paymentIntentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: string;
  paymentMethodType?: string;
  paymentEmail?: string;
}

interface SaveVideoResponse {
  success: boolean;
  videoId?: number;
  expiresAt?: string;
  error?: string;
}

export const saveVideoConfig: RequestHandler = async (req, res) => {
  try {
    const { email, imageBase64, duration, resolution } = req.body;

    console.log("[Save Config] Received request:", {
      hasEmail: !!email,
      hasImageBase64: !!imageBase64,
      imageLength: imageBase64?.length,
      duration,
      resolution,
    });

    // Validate inputs
    if (!email || !imageBase64 || !duration || !resolution) {
      console.error("[Save Config] Missing required fields");
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: email, imageBase64, duration, resolution",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      console.error("[Save Config] Invalid email:", email);
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate duration and resolution
    if (![5, 10].includes(duration)) {
      console.error("[Save Config] Invalid duration:", duration);
      return res.status(400).json({
        success: false,
        error: "Duration must be 5 or 10",
      });
    }

    if (!["720p", "1080p"].includes(resolution)) {
      console.error("[Save Config] Invalid resolution:", resolution);
      return res.status(400).json({
        success: false,
        error: "Resolution must be 720p or 1080p",
      });
    }

    // Check if image_base64 is a string and has content
    if (typeof imageBase64 !== "string" || imageBase64.length < 100) {
      console.error(
        "[Save Config] Invalid image data (too short):",
        imageBase64?.substring(0, 50),
      );
      return res.status(400).json({
        success: false,
        error: "Invalid image data (image too small or corrupted)",
      });
    }

    // Check if it looks like a data URL (flexible check)
    if (!imageBase64.includes("data:") || !imageBase64.includes("base64")) {
      console.error("[Save Config] Invalid image format, should be data URL");
      return res.status(400).json({
        success: false,
        error: "Image must be in data URL format (data:image/...;base64,...)",
      });
    }

    console.log("[Save Config] Validation passed, inserting into database...");

    // Create a video record with awaiting_payment status
    const result = await query(
      `INSERT INTO videos (email, image_base64, duration, resolution, status)
       VALUES ($1, $2, $3, $4, 'awaiting_payment')
       RETURNING id, created_at, expires_at`,
      [email, imageBase64, duration, resolution],
    );

    if (!result.rows[0]) {
      throw new Error("No rows returned from insert");
    }

    const videoRecord = result.rows[0];

    console.log("[Save Config] Success! Created video record:", videoRecord.id);

    return res.status(200).json({
      success: true,
      videoId: videoRecord.id,
      status: "awaiting_payment",
      createdAt: videoRecord.created_at,
    });
  } catch (error) {
    console.error("[Save Config] Database error:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save video configuration",
    });
  }
};

export const saveVideo: RequestHandler = async (req, res) => {
  try {
    const {
      email,
      videoUrl,
      videoId,
      requestId,
      duration,
      resolution,
      paymentIntentId,
      paymentAmount,
      paymentCurrency,
      paymentStatus,
      paymentMethodType,
      paymentEmail,
    } = req.body as SaveVideoRequest;

    // Validate inputs
    if (!email || !duration || !resolution) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Must have either videoUrl or requestId
    if (!videoUrl && !requestId) {
      return res.status(400).json({
        success: false,
        error: "Either videoUrl or requestId is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return res.status(400).json({
        success: false,
        error: "Invalid email",
      });
    }

    // Validate video URL if provided
    if (videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        return res.status(400).json({
          success: false,
          error: "Invalid video URL",
        });
      }
    }

    // Validate duration and resolution
    if (![5, 10].includes(duration)) {
      return res.status(400).json({
        success: false,
        error: "Invalid duration",
      });
    }

    if (!["720p", "1080p"].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: "Invalid resolution",
      });
    }

    // Determine status based on whether we have a video URL or just a request ID
    const status = videoUrl ? "completed" : "processing";

    // Check if a record with this payment_intent_id already exists
    let result;
    if (paymentIntentId) {
      const existingRecord = await query(
        `SELECT id FROM videos WHERE payment_intent_id = $1`,
        [paymentIntentId],
      );

      if (existingRecord.rows.length > 0) {
        // Update existing record
        result = await query(
          `UPDATE videos SET
            video_url = $1,
            video_id = $2,
            request_id = $3,
            duration = $4,
            resolution = $5,
            status = $6,
            payment_amount = $7,
            payment_currency = $8,
            payment_status = $9,
            payment_method_type = $10,
            payment_email = $11
           WHERE payment_intent_id = $12
           RETURNING id, expires_at, status`,
          [
            videoUrl || null,
            videoId || null,
            requestId || null,
            duration,
            resolution,
            status,
            paymentAmount || null,
            paymentCurrency || null,
            paymentStatus || null,
            paymentMethodType || null,
            paymentEmail || null,
            paymentIntentId,
          ],
        );
      } else {
        // Insert new record
        result = await query(
          `INSERT INTO videos (
            email, video_url, video_id, request_id, duration, resolution, status,
            payment_intent_id, payment_amount, payment_currency, payment_status,
            payment_method_type, payment_email
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id, expires_at, status`,
          [
            email,
            videoUrl || null,
            videoId || null,
            requestId || null,
            duration,
            resolution,
            status,
            paymentIntentId || null,
            paymentAmount || null,
            paymentCurrency || null,
            paymentStatus || null,
            paymentMethodType || null,
            paymentEmail || null,
          ],
        );
      }
    } else {
      // No payment_intent_id, insert new record
      result = await query(
        `INSERT INTO videos (
          email, video_url, video_id, request_id, duration, resolution, status,
          payment_intent_id, payment_amount, payment_currency, payment_status,
          payment_method_type, payment_email
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, expires_at, status`,
        [
          email,
          videoUrl || null,
          videoId || null,
          requestId || null,
          duration,
          resolution,
          status,
          paymentIntentId || null,
          paymentAmount || null,
          paymentCurrency || null,
          paymentStatus || null,
          paymentMethodType || null,
          paymentEmail || null,
        ],
      );
    }

    const videoRecord = result.rows[0];

    return res.status(200).json({
      success: true,
      videoId: videoRecord.id,
      status: videoRecord.status,
      expiresAt: videoRecord.expires_at,
    });
  } catch (error) {
    console.error("Save video error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save video",
    });
  }
};

export const getVideosByEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email",
      });
    }

    // Get non-deleted videos for the email
    const result = await query(
      `SELECT id, email, video_url, duration, resolution, status, error_message, created_at, expires_at, request_id,
              payment_intent_id, payment_amount, payment_currency, payment_status, payment_method_type, payment_email
       FROM videos
       WHERE email = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [email],
    );

    return res.status(200).json({
      success: true,
      videos: result.rows,
    });
  } catch (error) {
    console.error("Get videos error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve videos",
    });
  }
};

export const getVideoStatus: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID required",
      });
    }

    const result = await query(
      `SELECT id, status, error_message, video_url, created_at, expires_at,
              payment_intent_id, payment_amount, payment_currency, payment_status, payment_method_type, payment_email
       FROM videos
       WHERE id = $1 AND deleted_at IS NULL`,
      [videoId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    return res.status(200).json({
      success: true,
      video: result.rows[0],
    });
  } catch (error) {
    console.error("Get video status error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve video status",
    });
  }
};

export const deleteVideo: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID required",
      });
    }

    const result = await query(
      `UPDATE videos SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [videoId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete video",
    });
  }
};
