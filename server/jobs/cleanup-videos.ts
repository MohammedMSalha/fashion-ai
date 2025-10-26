import cron from "node-cron";
import { query } from "../db.js";

export function startCleanupJob() {
  // Run cleanup job every 10 minutes
  // Delete videos where expires_at <= now(), regardless of status
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("[CleanupJob] Running video cleanup job...");

      // First, check which videos will be deleted
      const checkResult = await query(
        `SELECT id, email, status, created_at, expires_at
         FROM videos
         WHERE expires_at <= CURRENT_TIMESTAMP
         AND deleted_at IS NULL`,
      );

      const videosToDelete = checkResult.rows.length;

      if (videosToDelete > 0) {
        console.log(
          `[CleanupJob] Found ${videosToDelete} expired video(s) to delete:`,
        );
        checkResult.rows.forEach((row: any) => {
          console.log(
            `[CleanupJob] - Video ID: ${row.id}, Email: ${row.email}, Status: ${row.status}, Expired: ${row.expires_at}`,
          );
        });
      }

      // Delete all expired videos regardless of status
      const result = await query(
        `UPDATE videos
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE expires_at <= CURRENT_TIMESTAMP
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
    console.log("Running manual video cleanup...");

    const result = await query(
      `UPDATE videos 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE expires_at <= CURRENT_TIMESTAMP 
       AND deleted_at IS NULL
       RETURNING id, email`,
    );

    console.log(
      `Manual cleanup completed. Deleted ${result.rowCount} expired videos.`,
    );

    return {
      success: true,
      deletedCount: result.rowCount,
    };
  } catch (error) {
    console.error("Manual cleanup error:", error);
    throw error;
  }
}
