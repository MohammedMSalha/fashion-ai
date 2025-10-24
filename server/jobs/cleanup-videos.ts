import cron from "node-cron";
import { query } from "../db.js";

export function startCleanupJob() {
  // Run cleanup job every hour
  // Delete videos where expires_at <= now() and deleted_at is null
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running video cleanup job...");

      const result = await query(
        `UPDATE videos 
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE expires_at <= CURRENT_TIMESTAMP 
         AND deleted_at IS NULL`,
      );

      console.log(
        `Cleanup job completed. Deleted ${result.rowCount} expired videos.`,
      );
    } catch (error) {
      console.error("Video cleanup job error:", error);
    }
  });

  console.log("Video cleanup job started (runs every hour)");
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
