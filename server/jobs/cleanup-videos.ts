import cron from "node-cron";
import { query } from "../db.js";

export function startCleanupJob() {
  // Run cleanup job every 10 minutes
  // Hard delete videos where expires_at has passed, regardless of status
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("[CleanupJob] Running video cleanup job...");

      // First, check which videos will be deleted
      const checkResult = await query(
        `SELECT id, email, status, created_at, expires_at,
                CURRENT_TIMESTAMP as now
         FROM videos
         WHERE expires_at < CURRENT_TIMESTAMP`,
      );

      const videosToDelete = checkResult.rows.length;

      if (videosToDelete > 0) {
        console.log(
          `[CleanupJob] Found ${videosToDelete} expired video(s) to delete:`,
        );
        checkResult.rows.forEach((row: any) => {
          console.log(
            `[CleanupJob] - Video ID: ${row.id}, Email: ${row.email}, Status: ${row.status}`,
          );
          console.log(
            `[CleanupJob]   Expires: ${row.expires_at}, Current time: ${row.now}`,
          );
        });
      }

      // Soft delete all expired videos regardless of status
      const result = await query(
        `UPDATE videos
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE expires_at < CURRENT_TIMESTAMP
         AND deleted_at IS NULL`,
      );

      console.log(
        `[CleanupJob] ✓ Cleanup completed. Deleted ${result.rowCount} expired video(s).`,
      );
    } catch (error) {
      console.error("[CleanupJob] ✗ Error during cleanup:", error);
    }
  });

  console.log("[CleanupJob] Video cleanup job started (runs every 10 minutes)");
}

// Manual cleanup function (can be called on demand)
export async function cleanupExpiredVideos() {
  try {
    console.log("[ManualCleanup] Running manual video cleanup...");

    // First, check which videos will be deleted
    const checkResult = await query(
      `SELECT id, email, status, created_at, expires_at,
              CURRENT_TIMESTAMP as now
       FROM videos
       WHERE expires_at < CURRENT_TIMESTAMP`,
    );

    const videosToDelete = checkResult.rows.length;

    if (videosToDelete > 0) {
      console.log(
        `[ManualCleanup] Found ${videosToDelete} expired video(s) to delete:`,
      );
      checkResult.rows.forEach((row: any) => {
        console.log(
          `[ManualCleanup] - Video ID: ${row.id}, Email: ${row.email}, Status: ${row.status}`,
        );
        console.log(
          `[ManualCleanup]   Expires: ${row.expires_at}, Current: ${row.now}`,
        );
      });
    }

    // Soft delete all expired videos regardless of status
    const result = await query(
      `UPDATE videos
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE expires_at < CURRENT_TIMESTAMP
       AND deleted_at IS NULL
       RETURNING id, email, status, expires_at`,
    );

    console.log(
      `[ManualCleanup] ✓ Cleanup completed. Deleted ${result.rowCount} expired video(s).`,
    );

    return {
      success: true,
      deletedCount: result.rowCount,
    };
  } catch (error) {
    console.error("[ManualCleanup] ✗ Error:", error);
    throw error;
  }
}
