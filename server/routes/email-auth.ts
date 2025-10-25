import { RequestHandler } from "express";
import {
  sendVerificationCode,
  verifyCode,
  getSMTPStatus,
} from "../services/email-verification.js";

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const getSMTPStatusHandler: RequestHandler = async (_req, res) => {
  try {
    const status = getSMTPStatus();
    return res.status(200).json({
      success: true,
      requiresVerification: status.enabled,
      smtpConfigured: status.configured,
    });
  } catch (error) {
    console.error("SMTP status check error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check SMTP status",
    });
  }
};

export const sendCodeHandler: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    const result = await sendVerificationCode(email);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send code",
        requiresCode: result.requiresCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent",
      requiresCode: result.requiresCode,
    });
  } catch (error) {
    console.error("Send code error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send verification code",
    });
  }
};

export const verifyCodeHandler: RequestHandler = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Code is required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    const result = verifyCode(email, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Verification failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
};
