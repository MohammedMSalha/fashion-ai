import { RequestHandler } from "express";
import { generateVideoAsync } from "../services/video-status.js";

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

// Input validation helper
const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const generateVideo: RequestHandler = async (req, res) => {
  try {
    const { image, duration, resolution, email } =
      req.body as GenerateVideoRequest;

    // Validate required fields
    if (!image || !duration || !resolution || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate image URL
    if (!validateImageUrl(image)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image URL",
      });
    }

    // Validate duration
    if (![5, 10].includes(duration)) {
      return res.status(400).json({
        success: false,
        error: "Invalid duration",
      });
    }

    // Validate resolution
    if (!["720p", "1080p"].includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: "Invalid resolution",
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Get API key from environment variables
    const apiKey = process.env.FASHN_AI_API_KEY;
    if (!apiKey) {
      console.error("FASHN_AI_API_KEY not configured");
      return res.status(500).json({
        success: false,
        error: "Service temporarily unavailable",
      });
    }

    // Call Fashn.ai API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!fashnResponse.ok) {
      console.error("Fashn.ai API error:", fashnResponse.status);
      return res.status(500).json({
        success: false,
        error: "Video generation service error",
      });
    }

    const videoData = await fashnResponse.json();

    // Validate response
    if (
      !videoData.id &&
      !videoData.request_id &&
      !videoData.output?.video_url &&
      !videoData.video_url
    ) {
      console.error("Invalid Fashn.ai response:", videoData);
      return res.status(500).json({
        success: false,
        error: "Invalid service response",
      });
    }

    // Return success response with request_id for status polling
    const requestId = videoData.id || videoData.request_id;
    return res.status(200).json({
      success: true,
      requestId,
      videoUrl: videoData.output?.video_url || videoData.video_url,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Video generation timeout");
      return res.status(504).json({
        success: false,
        error: "Request timeout",
      });
    }
    console.error("Video generation error:", error);
    return res.status(500).json({
      success: false,
      error: "Service temporarily unavailable",
    });
  }
};
