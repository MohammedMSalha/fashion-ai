import { query } from "../db.js";

interface FashnStatusResponse {
  id: string;
  status:
    | "starting"
    | "in_queue"
    | "processing"
    | "submitted"
    | "completed"
    | "succeeded";
  output?: string[];
  error?: {
    message?: string;
  } | null;
}

export async function checkVideoGenerationStatus(
  requestId: string,
): Promise<FashnStatusResponse | null> {
  try {
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("[CheckStatus] FASHN_AI_API_KEY not configured");
      return null;
    }

    console.log(`[CheckStatus] Checking status for request: ${requestId}`);

    const response = await fetch(
      `https://api.fashn.ai/v1/status/${requestId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`[CheckStatus] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(
        `[CheckStatus] Failed to check video status: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    console.log(`[CheckStatus] Response data:`, JSON.stringify(data, null, 2));
    console.log(`[CheckStatus] Status field: "${data.status}"`);
    console.log(`[CheckStatus] Output array:`, data.output);
    console.log(`[CheckStatus] Error field:`, data.error);
    return data as FashnStatusResponse;
  } catch (error) {
    console.error("[CheckStatus] Error checking video status:", error);
    return null;
  }
}

export async function updateVideoStatusFromFashn(
  requestId: string,
): Promise<void> {
  try {
    const status = await checkVideoGenerationStatus(requestId);
    if (!status) {
      console.log(
        `[UpdateStatus] No status response for request: ${requestId}`,
      );
      return;
    }

    console.log(`[UpdateStatus] Fashion.ai response status: ${status.status}`);
    console.log(
      `[UpdateStatus] Fashion.ai response output:`,
      status.output ? `${status.output.length} item(s)` : "none",
    );
    if (status.error) {
      console.log(`[UpdateStatus] Fashion.ai error:`, status.error);
    }

    // Find the video record by request_id
    const videoResult = await query(
      `SELECT id, status FROM videos WHERE request_id = $1`,
      [requestId],
    );

    if (videoResult.rows.length === 0) {
      console.log(
        `[UpdateStatus] No video record found for request: ${requestId}`,
      );
      return;
    }

    const videoId = videoResult.rows[0].id;
    const currentStatus = videoResult.rows[0].status;
    console.log(
      `[UpdateStatus] Found video ${videoId} with current status: ${currentStatus}`,
    );

    // Update based on status (matching PHP logic from Laravel)
    // Status is "completed" or "succeeded" when done
    if (
      (status.status === "completed" || status.status === "succeeded") &&
      status.output &&
      status.output.length > 0
    ) {
      const videoUrl = status.output[0];
      console.log(
        `[UpdateStatus] Video ${videoId} completed! URL: ${videoUrl}`,
      );

      const updateResult = await query(
        `UPDATE videos
         SET status = 'completed',
             video_url = $1,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, status, video_url`,
        [videoUrl, videoId],
      );

      console.log(
        `[UpdateStatus] ✓ Video ${videoId} marked as completed with URL`,
      );
      console.log(
        `[UpdateStatus] Update result:`,
        JSON.stringify(updateResult.rows[0]),
      );
    } else if (
      // Still processing - check all possible processing statuses
      status.status === "processing" ||
      status.status === "submitted" ||
      status.status === "starting" ||
      status.status === "in_queue"
    ) {
      // Still processing, no update needed
      console.log(
        `[UpdateStatus] Video ${videoId} still ${status.status} - next check in 10 seconds`,
      );
    } else {
      // All other statuses are treated as failures
      const errorMessage =
        status.error?.message ||
        `Generation failed with status: ${status.status}`;
      console.log(`[UpdateStatus] Video ${videoId} failed: ${errorMessage}`);

      const updateResult = await query(
        `UPDATE videos
         SET status = 'failed',
             error_message = $1
         WHERE id = $2
         RETURNING id, status, error_message`,
        [errorMessage, videoId],
      );

      console.log(`[UpdateStatus] ✓ Video ${videoId} marked as failed`);
      console.log(
        `[UpdateStatus] Update result:`,
        JSON.stringify(updateResult.rows[0]),
      );
    }
  } catch (error) {
    console.error("[UpdateStatus] Error updating video status:", error);
  }
}

export async function checkAndUpdateAllPendingVideos(): Promise<void> {
  try {
    console.log("[CheckAllPending] ========== CRON JOB STARTING ==========");

    // Get all videos that are still processing
    let result;
    try {
      result = await query(
        `SELECT id, request_id FROM videos WHERE status = 'processing' AND request_id IS NOT NULL ORDER BY created_at DESC`,
      );
    } catch (columnError) {
      // If request_id column doesn't exist, try without it
      if (
        columnError instanceof Error &&
        columnError.message.includes('column "request_id" does not exist')
      ) {
        console.warn(
          "[CheckAllPending] request_id column not found, skipping status checks. Run database migration.",
        );
        return;
      }
      throw columnError;
    }

    const pendingCount = result.rows.length;

    if (pendingCount === 0) {
      console.log("[CheckAllPending] ✓ No pending videos to check");
      return;
    }

    console.log(
      `[CheckAllPending] Found ${pendingCount} pending video(s) to check`,
    );

    // Get the API base URL - use environment variable or fall back to localhost
    const apiBaseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:5173";

    console.log(`[CheckAllPending] Using API base: ${apiBaseUrl}`);

    // Check status for each pending video by calling the internal API
    for (const row of result.rows) {
      try {
        console.log(
          `[CheckAllPending] Checking video ${row.id} with request ${row.request_id}`,
        );

        const statusUrl = `${apiBaseUrl}/api/video-status/${row.id}`;
        console.log(`[CheckAllPending] Calling: ${statusUrl}`);

        const response = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error(
            `[CheckAllPending] Failed to check video ${row.id}: ${response.status}`,
          );
          continue;
        }

        const data = await response.json();

        if (data.video) {
          const status = data.video.status;
          console.log(
            `[CheckAllPending] Video ${row.id} status from API: ${status}`,
          );

          if (status === "completed") {
            console.log(
              `[CheckAllPending] ✓ Video ${row.id} completed with URL: ${data.video.video_url}`,
            );
          } else if (status === "failed") {
            console.log(
              `[CheckAllPending] ✗ Video ${row.id} failed: ${data.video.error_message}`,
            );
          } else {
            console.log(
              `[CheckAllPending] Video ${row.id} still processing...`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[CheckAllPending] Error checking video ${row.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.log(
      `[CheckAllPending] ========== Completed check for ${pendingCount} video(s) ==========`,
    );
  } catch (error) {
    console.error("[CheckAllPending] Fatal error:", error);
  }
}

interface GenerateVideoResult {
  success: boolean;
  requestId?: string;
  videoUrl?: string;
  error?: string;
}

export async function generateVideoAsync(
  imageUrlOrBase64: string,
  duration: 5 | 10,
  resolution: "720p" | "1080p",
  userApiKey?: string,
): Promise<GenerateVideoResult> {
  try {
    // Use user-provided API key if available, otherwise use system key
    const apiKey = userApiKey || process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("[GenerateVideo] FASHN_AI_API_KEY not configured");
      return {
        success: false,
        error: "FASHN_AI_API_KEY not configured",
      };
    }

    const isUsingUserKey = !!userApiKey;
    console.log("[GenerateVideo] Using", isUsingUserKey ? "user-provided" : "system", "API key");

    console.log("[GenerateVideo] Starting video generation");
    console.log(
      "[GenerateVideo] Image type:",
      imageUrlOrBase64.startsWith("data:") ? "base64 data URL" : "URL",
    );
    console.log(
      "[GenerateVideo] Duration:",
      duration,
      "Resolution:",
      resolution,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Pass image as-is (can be URL or base64 data URL)
    const payload = {
      model_name: "image-to-video",
      inputs: {
        image: imageUrlOrBase64,
        duration,
        resolution,
      },
    };

    console.log(
      "[GenerateVideo] Image payload length:",
      imageUrlOrBase64.length,
      "bytes",
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
    console.error("[GenerateVideo] ��� Error:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
