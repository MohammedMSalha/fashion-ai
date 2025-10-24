import { RequestHandler } from "express";
import { query } from "../db";

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

    // Insert video record into database with payment data
    const result = await query(
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
      `SELECT id, email, video_url, duration, resolution, status, error_message, created_at, expires_at, request_id
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
      `SELECT id, status, error_message, video_url, created_at, expires_at
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
