let expressApp: any = null;
let initError: Error | null = null;

async function initializeApp() {
  // Return cached app if already initialized
  if (expressApp) return expressApp;

  // Return error if initialization failed before
  if (initError) throw initError;

  try {
    console.log("[Serverless] Initializing Express app...");

    // Try to import the createServer function from server module
    let createServer: any;

    try {
      // First try: Direct ESM import from TypeScript source
      console.log("[Serverless] Attempting import from ../server/index.ts...");
      const mod = await import("../server/index.ts");
      createServer = mod.createServer;
    } catch (e1) {
      console.log(
        `[Serverless] Failed to import from ../server/index.ts: ${e1}`,
      );

      try {
        // Second try: ESM import from compiled JS
        console.log("[Serverless] Attempting import from ../server/index.js...");
        const mod = await import("../server/index.js");
        createServer = mod.createServer;
      } catch (e2) {
        console.log(
          `[Serverless] Failed to import from ../server/index.js: ${e2}`,
        );

        try {
          // Third try: ESM import from relative path without extension
          console.log("[Serverless] Attempting import from ../server...");
          const mod = await import("../server/index");
          createServer = mod.createServer;
        } catch (e3) {
          console.log(`[Serverless] Failed to import from ../server: ${e3}`);
          throw new Error(
            `Failed to import createServer from any path. Tried: ../server/index.ts, ../server/index.js, ../server. Errors: ${e1}, ${e2}, ${e3}`,
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

      // In Vercel, the body might already be parsed
      // We need to reconstruct the raw body for Stripe signature verification
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

      // Invoke the Express app
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
