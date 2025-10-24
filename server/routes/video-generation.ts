import { RequestHandler } from "express";

interface GenerateVideoRequest {
  image: string;
  duration: 5 | 10;
  resolution: "720p" | "1080p";
  email: string;
}

interface GenerateVideoResponse {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
}

export const generateVideo: RequestHandler = async (req, res) => {
  try {
    const { image, duration, resolution, email } = req.body as GenerateVideoRequest;

    // Validate inputs
    if (!image || !duration || !resolution || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: image, duration, resolution, email",
      });
    }

    if (![5, 10].includes(duration)) {
      return res.status(400).json({
        success: false,
        error: "Duration must be 5 or 10 seconds",
      });
    }

    if (!["720p", "1080p"].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: "Resolution must be 720p or 1080p",
      });
    }

    // Get API key from environment variables
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("FASHN_AI_API_KEY not configured");
      return res.status(500).json({
        success: false,
        error: "Video generation service is not configured",
      });
    }

    // Call Fashn.ai API
    const fashnResponse = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_name: "image-to-video",
        inputs: {
          image,
          duration,
          resolution,
        },
      }),
    });

    if (!fashnResponse.ok) {
      const errorData = await fashnResponse.text();
      console.error("Fashn.ai API error:", errorData);
      return res.status(fashnResponse.status).json({
        success: false,
        error: `Video generation failed: ${fashnResponse.statusText}`,
      });
    }

    const videoData = await fashnResponse.json();

    // Return success response
    return res.status(200).json({
      success: true,
      videoId: videoData.id || videoData.request_id,
      videoUrl: videoData.output?.video_url || videoData.video_url,
    });
  } catch (error) {
    console.error("Video generation error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
