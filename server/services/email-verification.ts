import nodemailer from "nodemailer";

interface VerificationCode {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

const verificationCodes = new Map<string, VerificationCode>();

function isSMTPConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getTransporter() {
  if (!isSMTPConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationCode(email: string): Promise<{
  success: boolean;
  error?: string;
  requiresCode: boolean;
}> {
  const requiresCode = isSMTPConfigured();

  if (!requiresCode) {
    return {
      success: true,
      requiresCode: false,
    };
  }

  try {
    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store code in memory
    verificationCodes.set(email, {
      code,
      email,
      expiresAt,
      attempts: 0,
    });

    // Send email
    const transporter = await getTransporter();
    if (!transporter) {
      console.error("Failed to create email transporter");
      return {
        success: false,
        error: "Email service unavailable",
        requiresCode: true,
      };
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Fashion AI - Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 48px; letter-spacing: 10px; color: #000; margin: 30px 0;">
            ${code}
          </h1>
          <p>This code expires in 15 minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    });

    return {
      success: true,
      requiresCode: true,
    };
  } catch (error) {
    console.error("Failed to send verification code:", error);
    return {
      success: false,
      error: "Failed to send verification code",
      requiresCode: true,
    };
  }
}

export function verifyCode(
  email: string,
  code: string,
): {
  success: boolean;
  error?: string;
} {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return {
      success: false,
      error: "No verification code found for this email",
    };
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email);
    return {
      success: false,
      error: "Verification code has expired",
    };
  }

  stored.attempts++;
  if (stored.attempts > 5) {
    verificationCodes.delete(email);
    return {
      success: false,
      error: "Too many failed attempts. Please request a new code.",
    };
  }

  if (stored.code !== code) {
    return {
      success: false,
      error: "Invalid verification code",
    };
  }

  verificationCodes.delete(email);
  return {
    success: true,
  };
}

export function getSMTPStatus(): {
  enabled: boolean;
  configured: boolean;
} {
  const configured = isSMTPConfigured();
  return {
    enabled: configured,
    configured,
  };
}
