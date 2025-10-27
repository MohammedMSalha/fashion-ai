import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.STRIPE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.STRIPE_PUBLISHABLE_KEY,
    ),
    "import.meta.env.API_URL": JSON.stringify(process.env.API_URL || ""),
  },
  root: ".",
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      const app = await createServer();

      // Add middleware to intercept API requests before Vite's routing
      server.middlewares.use((req, res, next) => {
        // If it's an API request, handle it with Express
        if (req.url.startsWith("/api/")) {
          return app(req, res, next);
        }
        // Otherwise continue to next middleware
        next();
      });
    },
  };
}
