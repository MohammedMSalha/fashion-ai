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
    // Handle case where request_id column might not exist yet on production
    let result;
    try {
      result = await query(
        `SELECT request_id FROM videos WHERE status = 'processing' AND request_id IS NOT NULL`,
      );
    } catch (columnError) {
      // If request_id column doesn't exist, try without it
      if (
        columnError instanceof Error &&
        columnError.message.includes('column "request_id" does not exist')
      ) {
        console.warn(
          "request_id column not found, skipping status checks. Run database migration.",
        );
        return;
      }
      throw columnError;
    }

    for (const row of result.rows) {
      await updateVideoStatusFromFashn(row.request_id);
    }
  } catch (error) {
    console.error("Error checking pending videos:", error);
  }
}

interface GenerateVideoResult {
  success: boolean;
  requestId?: string;
  videoUrl?: string;
  error?: string;
}

export async function generateVideoAsync(
  imageUrl: string,
  duration: 5 | 10,
  resolution: "720p" | "1080p",
): Promise<GenerateVideoResult> {
  try {
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("[GenerateVideo] FASHN_AI_API_KEY not configured");
      return {
        success: false,
        error: "FASHN_AI_API_KEY not configured",
      };
    }

    console.log("[GenerateVideo] Starting video generation");
    console.log("[GenerateVideo] Image URL:", imageUrl);
    console.log(
      "[GenerateVideo] Duration:",
      duration,
      "Resolution:",
      resolution,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const payload = {
      model_name: "image-to-video",
      inputs: {
        image: imageUrl,
        duration,
        resolution,
      },
    };

    console.log(
      "[GenerateVideo] Sending to Fashn API:",
      JSON.stringify(payload),
    );

    const response = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[GenerateVideo] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[GenerateVideo] Fashn API error:",
        response.status,
        errorText,
      );
      return {
        success: false,
        error: `Fashn API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("[GenerateVideo] Response data:", data);

    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[GenerateVideo] No request ID in response");
      return {
        success: false,
        error: "No request ID received from Fashn API",
      };
    }

    console.log("[GenerateVideo] ✓ Success! Request ID:", requestId);

    return {
      success: true,
      requestId,
      videoUrl: data.output?.video_url || data.video_url,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Unknown error during video generation";
    console.error("[GenerateVideo] ✗ Error:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
