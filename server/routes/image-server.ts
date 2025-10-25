import { RequestHandler } from "express";
import { query } from "../db.js";

export const getImageByVideoId: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || isNaN(parseInt(videoId))) {
      return res.status(400).json({
        success: false,
        error: "Invalid video ID",
      });
    }

    console.log(`[Image Server] Retrieving image for video: ${videoId}`);

    // Get image from database
    const result = await query(
      `SELECT image_base64 FROM videos WHERE id = $1`,
      [parseInt(videoId)],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    const imageBase64 = result.rows[0].image_base64;

    if (!imageBase64) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    // Parse the data URL to get mime type and base64 data
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      // If it's already just base64 or data URL format issue, try to serve as jpeg
      const mimeType = imageBase64.includes("png") ? "image/png" : "image/jpeg";
      const base64Data = imageBase64
        .replace(/^data:[^;]+;base64,/, "")
        .replace(/^data:[^,]+,/, "");

      const imageBuffer = Buffer.from(base64Data, "base64");
      res.set("Content-Type", mimeType);
      res.set("Cache-Control", "max-age=3600"); // Cache for 1 hour
      return res.send(imageBuffer);
    }

    const [, mimeType, base64Data] = matches;
    const imageBuffer = Buffer.from(base64Data, "base64");

    res.set("Content-Type", mimeType);
    res.set("Cache-Control", "max-age=3600"); // Cache for 1 hour

    console.log(
      `[Image Server] Serving image for video ${videoId} (${mimeType})`,
    );

    res.send(imageBuffer);
  } catch (error) {
    console.error("[Image Server] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to serve image",
    });
  }
};
