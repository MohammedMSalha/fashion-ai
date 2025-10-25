import { createServer } from "../server/index.ts";
import { IncomingMessage, ServerResponse } from "http";
import { Readable, Writable } from "stream";

let cachedApp: any = null;
let initPromise: Promise<any> | null = null;

async function initializeApp() {
  if (cachedApp) return cachedApp;
  if (initPromise) return initPromise;

  initPromise = createServer();
  cachedApp = await initPromise;
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  console.log("[VercelHandler] Received request:", req.method, req.url);

  try {
    const app = await initializeApp();
    console.log("[VercelHandler] App ready, routing request");

    // If req is already a Node.js IncomingMessage, use it directly
    if (req instanceof IncomingMessage) {
      return app(req, res);
    }

    // Otherwise, we need to adapt Vercel's request format to Express
    // Create a fake IncomingMessage from Vercel's request
    const fakeReq = Object.create(IncomingMessage.prototype);
    fakeReq.url = req.url;
    fakeReq.method = req.method;
    fakeReq.headers = req.headers || {};
    fakeReq.body = req.body;
    fakeReq.query = req.query;
    fakeReq.cookies = req.cookies || {};

    // If there's a raw body, use it
    if (req.rawBody) {
      fakeReq.rawBody = req.rawBody;
    }

    // Create a Readable stream for the body
    if (req.body) {
      const readable = new Readable();
      if (typeof req.body === "string") {
        readable.push(req.body);
      } else if (Buffer.isBuffer(req.body)) {
        readable.push(req.body);
      } else {
        readable.push(JSON.stringify(req.body));
      }
      readable.push(null);
      Object.assign(fakeReq, readable);
    }

    console.log("[VercelHandler] Routing to Express app");
    return app(fakeReq, res);
  } catch (error) {
    console.error("[VercelHandler] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
