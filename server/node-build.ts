import path from "path";
import { createServer } from "./index.js";

async function start() {
  try {
    console.log("Starting server...");
    const app = await createServer();
    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Frontend: http://localhost:${port}`);
      console.log(`✓ API: http://localhost:${port}/api`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("Received SIGTERM, shutting down");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      console.log("Received SIGINT, shutting down");
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
