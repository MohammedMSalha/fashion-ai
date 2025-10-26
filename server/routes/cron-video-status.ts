import { RequestHandler } from "express";
import { checkAndUpdateAllPendingVideos } from "../services/video-status.js";

export const cronCheckVideoStatus: RequestHandler = async (req, res) => {
  try {
    // Verify request is from Vercel (basic security)
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (cronSecret && cronSecret !== "") {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn(
          "[CronCheckVideoStatus] ⚠ Missing or invalid authorization header",
        );
        return res.status(401).json({ error: "Unauthorized" });
      }

      const providedSecret = authHeader.substring(7);
      if (providedSecret !== cronSecret) {
        console.warn("[CronCheckVideoStatus] ⚠ Invalid cron secret");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    console.log(
      `[CronCheckVideoStatus] Cron job triggered at ${new Date().toISOString()}`,
    );

    // Run the video status check
    await checkAndUpdateAllPendingVideos();

    console.log("[CronCheckVideoStatus] ✓ Check completed successfully");

    return res.status(200).json({
      success: true,
      message: "Video status check completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CronCheckVideoStatus] ✗ Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
