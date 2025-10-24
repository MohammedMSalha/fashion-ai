import { RequestHandler } from "express";
import { query } from "../db";
import { updateVideoStatusFromFashn } from "../services/video-status";

export const checkPendingVideos: RequestHandler = async (req, res) => {
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

    // Get all pending videos for this email
    const result = await query(
      `SELECT id, request_id FROM videos 
       WHERE email = $1 AND status = 'processing' AND request_id IS NOT NULL AND deleted_at IS NULL`,
      [email],
    );

    // Check status for each pending video
    for (const row of result.rows) {
      await updateVideoStatusFromFashn(row.request_id);
    }

    // Return updated videos
    const updatedResult = await query(
      `SELECT id, email, video_url, duration, resolution, status, error_message, created_at, expires_at, request_id
       FROM videos
       WHERE email = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [email],
    );

    return res.status(200).json({
      success: true,
      checked: result.rows.length,
      videos: updatedResult.rows,
    });
  } catch (error) {
    console.error("Check pending videos error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check pending videos",
    });
  }
};
