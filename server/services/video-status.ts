import { query } from "../db.js";

interface FashnStatusResponse {
  id: string;
  request_id: string;
  status: "submitted" | "processing" | "completed" | "failed";
  result?: {
    video_url?: string;
  };
  error?: string;
}

export async function checkVideoGenerationStatus(
  requestId: string,
): Promise<FashnStatusResponse | null> {
  try {
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("FASHN_AI_API_KEY not configured");
      return null;
    }

    const response = await fetch(
      `https://api.fashn.ai/v1/requests/${requestId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      console.error(`Failed to check video status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as FashnStatusResponse;
  } catch (error) {
    console.error("Error checking video status:", error);
    return null;
  }
}

export async function updateVideoStatusFromFashn(
  requestId: string,
): Promise<void> {
  try {
    const status = await checkVideoGenerationStatus(requestId);
    if (!status) {
      return;
    }

    // Find the video record by request_id
    const videoResult = await query(
      `SELECT id FROM videos WHERE request_id = $1`,
      [requestId],
    );

    if (videoResult.rows.length === 0) {
      return;
    }

    const videoId = videoResult.rows[0].id;

    // Update based on status
    if (status.status === "completed" && status.result?.video_url) {
      await query(
        `UPDATE videos 
         SET status = 'completed', 
             video_url = $1,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [status.result.video_url, videoId],
      );
      console.log(`Video ${videoId} completed successfully`);
    } else if (status.status === "failed") {
      await query(
        `UPDATE videos 
         SET status = 'failed', 
             error_message = $1
         WHERE id = $2`,
        [status.error || "Generation failed", videoId],
      );
      console.log(`Video ${videoId} failed: ${status.error}`);
    } else if (
      status.status === "processing" ||
      status.status === "submitted"
    ) {
      // Still processing, no update needed
      console.log(`Video ${videoId} still processing`);
    }
  } catch (error) {
    console.error("Error updating video status:", error);
  }
}

export async function checkAndUpdateAllPendingVideos(): Promise<void> {
  try {
    // Get all videos that are still processing
    const result = await query(
      `SELECT request_id FROM videos WHERE status = 'processing' AND request_id IS NOT NULL`,
    );

    for (const row of result.rows) {
      await updateVideoStatusFromFashn(row.request_id);
    }
  } catch (error) {
    console.error("Error checking pending videos:", error);
  }
}
