import { RequestHandler } from "express";
import { cleanupExpiredVideos } from "../jobs/cleanup-videos.js";

export const cronCleanupVideos: RequestHandler = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log(
      `[CronCleanupVideos] ✓✓✓ CLEANUP JOB TRIGGERED at ${new Date().toISOString()}`,
    );

    const result = await cleanupExpiredVideos();

    const duration = Date.now() - startTime;
    console.log(
      `[CronCleanupVideos] ✓✓✓ Cleanup completed in ${duration}ms, deleted ${result.deletedCount} expired video(s)`,
    );

    return res.status(200).json({
      success: true,
      message: "Video cleanup completed",
      deletedCount: result.deletedCount,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CronCleanupVideos] ✗ Fatal error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
