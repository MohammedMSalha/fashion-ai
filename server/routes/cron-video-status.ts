import { RequestHandler } from "express";
import { query } from "../db.js";
import {
  checkVideoGenerationStatus,
  updateVideoStatusFromFashn,
} from "../services/video-status.js";

export const cronCheckVideoStatus: RequestHandler = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log(
      `[CronCheckVideoStatus] ✓✓✓ CRON JOB TRIGGERED at ${new Date().toISOString()}`,
    );

    // Run internal polling loop: check every 10 seconds for up to 2 minutes
    const pollIntervalMs = 10000; // 10 seconds
    const maxDurationMs = 120000; // 2 minutes
    const maxAttempts = Math.ceil(maxDurationMs / pollIntervalMs);

    let checksCompleted = 0;
    let videosUpdated = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(
          `[CronCheckVideoStatus] Polling attempt ${attempt + 1}/${maxAttempts} at ${new Date().toISOString()}`,
        );

        // Get all videos that are still processing
        const result = await query(
          `SELECT id, request_id FROM videos WHERE status = 'processing' AND request_id IS NOT NULL ORDER BY created_at DESC`,
        );

        const pendingCount = result.rows.length;

        if (pendingCount === 0) {
          console.log(
            `[CronCheckVideoStatus] ✓ No pending videos to check (attempt ${attempt + 1})`,
          );
          checksCompleted++;

          // If no pending videos for 2 consecutive checks, we can stop early
          if (attempt > 0) {
            break;
          }
        } else {
          console.log(
            `[CronCheckVideoStatus] Found ${pendingCount} pending video(s) to check (attempt ${attempt + 1})`,
          );

          // Check status for each pending video using the service
          for (const row of result.rows) {
            try {
              console.log(
                `[CronCheckVideoStatus] Checking video ${row.id} with request ${row.request_id}`,
              );

              await updateVideoStatusFromFashn(row.request_id);
              videosUpdated++;
            } catch (error) {
              console.error(
                `[CronCheckVideoStatus] Error checking video ${row.id}:`,
                error instanceof Error ? error.message : error,
              );
            }
          }

          checksCompleted++;
        }

        // Wait before next polling attempt (except on last iteration)
        if (attempt < maxAttempts - 1) {
          console.log(
            `[CronCheckVideoStatus] Waiting 10 seconds before next poll...`,
          );
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      } catch (pollError) {
        console.error(
          `[CronCheckVideoStatus] Error during polling attempt ${attempt + 1}:`,
          pollError instanceof Error ? pollError.message : pollError,
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[CronCheckVideoStatus] ✓✓✓ Polling completed in ${duration}ms (${checksCompleted} checks, ${videosUpdated} videos updated)`,
    );

    return res.status(200).json({
      success: true,
      message: "Video status check completed",
      checksCompleted,
      videosUpdated,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CronCheckVideoStatus] ✗ Fatal error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
