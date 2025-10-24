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

    // Call video generation service
    const result = await generateVideoAsync(image, duration, resolution);

    if (result.success) {
      return res.status(200).json({
        success: true,
        requestId: result.requestId,
        videoUrl: result.videoUrl,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Video generation failed",
      });
    }
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
