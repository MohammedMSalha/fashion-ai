import { RequestHandler } from "express";
import { checkAndUpdateAllPendingVideos } from "../services/video-status.js";

export const cronCheckVideoStatus: RequestHandler = async (req, res) => {
  try {
    // Verify request is from Vercel (basic security)
    // Note: Vercel crons don't send a secret automatically; this is optional
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (cronSecret && cronSecret.trim() !== "") {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn(
          "[CronCheckVideoStatus] ⚠ Missing authorization header (VERCEL_CRON_SECRET is set)",
        );
        return res.status(401).json({ error: "Unauthorized" });
      }

      const providedSecret = authHeader.substring(7);
      if (providedSecret !== cronSecret) {
        console.warn(
          "[CronCheckVideoStatus] ⚠ Invalid cron secret provided",
        );
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      console.log(
        "[CronCheckVideoStatus] ℹ No VERCEL_CRON_SECRET set - allowing unauthenticated access",
      );
    }

    const startTime = Date.now();
    console.log(
      `[CronCheckVideoStatus] ✓✓✓ CRON JOB TRIGGERED at ${new Date().toISOString()}`,
    );

    // Run the video status check
    await checkAndUpdateAllPendingVideos();

    const duration = Date.now() - startTime;
    console.log(
      `[CronCheckVideoStatus] ✓✓✓ Check completed successfully in ${duration}ms`,
    );

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
