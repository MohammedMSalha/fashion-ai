import serverless from "serverless-http";
import { createServer } from "../../server/index.js";

const NETLIFY_BASE_PATH = "/.netlify/functions/api";

let app: any = null;
let cachedHandler: any = null;

async function getApp() {
  if (!app) {
    console.log("[Netlify] Initializing Express app...");
    app = await createServer();
    console.log("[Netlify] Express app initialized");
  }
  return app;
}

async function getHandler() {
  if (!cachedHandler) {
    const expressApp = await getApp();
    cachedHandler = serverless(expressApp, { basePath: NETLIFY_BASE_PATH });
  }
  return cachedHandler;
}

export const handler = async (event: any, context: any) => {
  console.log(`[Netlify] ${event.httpMethod} ${event.path}`);

  // Preserve raw body for Stripe webhook if needed
  const webhookPaths = new Set([
    "/api/stripe-webhook",
    `${NETLIFY_BASE_PATH}/stripe-webhook`,
  ]);

  if (webhookPaths.has(event.path)) {
    console.log("[Netlify] Webhook request detected");
    if (typeof event.body === "string") {
      event.rawBody = event.body;
    } else if (Buffer.isBuffer(event.body)) {
      event.rawBody = event.body.toString("utf-8");
    } else if (typeof event.body === "object") {
      event.rawBody = JSON.stringify(event.body);
    }
  }

  const handler = await getHandler();
  return handler(event, context);
};
