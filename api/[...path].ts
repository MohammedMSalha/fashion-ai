import serverless from "serverless-http";
import { createServer } from "../server/index.js";

let serverlessHandler: any;

export default async (req: any, res: any) => {
  // Initialize the server handler on first request
  if (!serverlessHandler) {
    const app = await createServer();
    serverlessHandler = serverless(app);
  }

  return serverlessHandler(req, res);
};
