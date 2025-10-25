import path from "path";
import { createServer } from "./index";
import * as express from "express";

async function start() {
  try {
    console.log("Starting server...");
    const app = await createServer();
    const port = process.env.PORT || 3000;

    // In production, serve the built SPA files
    const __dirname = import.meta.dirname;
    const distPath = path.join(__dirname, "../spa");

    // Disable caching for API endpoints
    app.use("/api/", (req, res, next) => {
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      next();
    });

    // Serve static files
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.all("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        console.warn(
          `[API] 404: ${req.method} ${req.path} - endpoint not found`,
        );
        return res.status(404).json({
          error: "API endpoint not found",
          path: req.path,
          method: req.method,
        });
      }

      // Serve index.html for all other routes (React Router will handle them)
      res.sendFile(path.join(distPath, "index.html"));
    });

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
