import serverless from "serverless-http";
import { createServer } from "../../server/index.js";

let app: any = null;

async function getApp() {
  if (!app) {
    console.log("[Netlify] Initializing Express app...");
    app = await createServer();
    console.log("[Netlify] Express app initialized");
  }
  return app;
}

export const handler = async (event: any, context: any) => {
  console.log(`[Netlify] ${event.httpMethod} ${event.path}`);

  // Preserve raw body for Stripe webhook if needed
  if (event.path === "/api/webhook/stripe") {
    console.log("[Netlify] Webhook request detected");
    if (typeof event.body === "string") {
      event.rawBody = event.body;
    } else if (Buffer.isBuffer(event.body)) {
      event.rawBody = event.body.toString("utf-8");
    } else if (typeof event.body === "object") {
      event.rawBody = JSON.stringify(event.body);
    }
  }

  const app = await getApp();
  const handler = serverless(app);
  return handler(event, context);
};
