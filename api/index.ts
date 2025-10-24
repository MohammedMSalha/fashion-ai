import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import { createServer } from "../server/index";

const server = createServer();
const handler = serverless(server);

export default async (req: VercelRequest, res: VercelResponse) => {
  return handler(req, res);
};
