import path from "path";
import { fileURLToPath } from "url";

let expressApp: any = null;
let initError: Error | null = null;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeApp() {
  // Return cached app if already initialized
  if (expressApp) return expressApp;

  // Return error if initialization failed before
  if (initError) throw initError;

  try {
    console.log("[Serverless] Initializing Express app...");
    console.log("[Serverless] __dirname:", __dirname);

    // Calculate the path to server/index
    const serverPath = path.resolve(__dirname, "..", "server", "index.ts");
    const serverPathJS = path.resolve(__dirname, "..", "server", "index.js");

    console.log("[Serverless] Attempting to import from:", serverPath);

    let createServer: any;

    try {
      // Try direct import with full path
      const mod = await import(serverPath);
      createServer = mod.createServer;
    } catch (e1) {
      console.log("[Serverless] Failed with .ts path:", e1);

      try {
        // Try .js path
        console.log("[Serverless] Attempting to import from:", serverPathJS);
        const mod = await import(serverPathJS);
        createServer = mod.createServer;
      } catch (e2) {
        console.log("[Serverless] Failed with .js path:", e2);

        // Try relative import as fallback
        try {
          console.log(
            "[Serverless] Attempting fallback relative import from ../server/index.ts...",
          );
          const mod = await import("../server/index.ts");
          createServer = mod.createServer;
        } catch (e3) {
          console.log("[Serverless] All import attempts failed");
          throw new Error(
            `Failed to import createServer. Tried: ${serverPath}, ${serverPathJS}, ../server/index.ts`,
          );
        }
      }
    }

    if (typeof createServer !== "function") {
      throw new Error(
        `createServer is not a function, got: ${typeof createServer}`,
      );
    }

    console.log("[Serverless] Creating Express app instance...");
    expressApp = await createServer();

    if (!expressApp) {
      throw new Error("createServer returned falsy value");
    }

    console.log("[Serverless] ✓ Express app initialized successfully");
    return expressApp;
  } catch (error) {
    initError = error as Error;
    console.error("[Serverless] ✗ Failed to initialize app:", error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    console.log(`[Serverless] ${req.method} ${pathname}`);

    // Initialize Express app on first request
    const app = await initializeApp();

    // For Stripe webhook, preserve the raw body
    if (pathname === "/api/webhook/stripe") {
      console.log("[Serverless] Webhook request detected");

      if (typeof req.body === "string") {
        console.log("[Serverless] Body is string");
        req.rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        console.log("[Serverless] Body is Buffer");
        req.rawBody = req.body.toString("utf-8");
      } else if (typeof req.body === "object") {
        console.log("[Serverless] Body is object, stringifying");
        req.rawBody = JSON.stringify(req.body);
      } else {
        console.log("[Serverless] Body is unknown type");
        req.rawBody = "";
      }

      console.log("[Serverless] rawBody length:", req.rawBody?.length || 0);
    }

    // Pass request to Express app
    return new Promise<void>((resolve) => {
      const originalEnd = res.end.bind(res);

      res.end = function (...args: any[]) {
        originalEnd(...args);
        resolve();
      };

      app(req, res);
    });
  } catch (error) {
    console.error("[Serverless] Handler error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Server initialization failed",
        details:
          error instanceof Error
            ? error.message
            : String(error).substring(0, 200),
      });
    }
  }
}
