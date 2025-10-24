import serverless from "serverless-http";
import { createServer } from "../server/index";

let handler: any = null;

async function initializeHandler() {
  if (!handler) {
    const app = await createServer();
    handler = serverless(app);
  }
  return handler;
}

export default async (req: any, res: any) => {
  const serverHandler = await initializeHandler();
  return serverHandler(req, res);
};
