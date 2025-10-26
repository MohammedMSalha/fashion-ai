import { RequestHandler } from "express";
import { query } from "../db.js";

export const debugCleanup: RequestHandler = async (req, res) => {
  try {
    console.log("[DebugCleanup] Checking videos for cleanup eligibility");

    // Get all videos and show their expiry status
    const allVideos = await query(
      `SELECT id, email, status, created_at, expires_at, deleted_at,
              CURRENT_TIMESTAMP as server_time,
              (expires_at AT TIME ZONE 'UTC' <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC') as is_expired
       FROM videos
       ORDER BY expires_at DESC
       LIMIT 20`,
    );

    // Get videos that SHOULD be deleted
    const expiredVideos = await query(
      `SELECT id, email, status, created_at, expires_at, deleted_at,
              CURRENT_TIMESTAMP as server_time
       FROM videos
       WHERE expires_at AT TIME ZONE 'UTC' <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       AND deleted_at IS NULL`,
    );

    console.log("[DebugCleanup] Videos to be deleted:");
    expiredVideos.rows.forEach((row: any) => {
      console.log(`[DebugCleanup] - ID: ${row.id}, Email: ${row.email}, Status: ${row.status}`);
      console.log(
        `[DebugCleanup]   Expires: ${row.expires_at}, Server Time: ${row.server_time}`,
      );
    });

    return res.status(200).json({
      serverTime: new Date().toISOString(),
      totalVideos: allVideos.rows.length,
      expiredVideos: expiredVideos.rows.length,
      videosToDelete: expiredVideos.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        status: row.status,
        created_at: row.created_at,
        expires_at: row.expires_at,
        deleted_at: row.deleted_at,
      })),
      recentVideos: allVideos.rows.slice(0, 5).map((row: any) => ({
        id: row.id,
        email: row.email,
        status: row.status,
        created_at: row.created_at,
        expires_at: row.expires_at,
        deleted_at: row.deleted_at,
        is_expired: row.is_expired,
      })),
    });
  } catch (error) {
    console.error("[DebugCleanup] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
