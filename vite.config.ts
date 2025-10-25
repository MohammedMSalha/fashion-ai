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
  },
  root: ".",
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
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

      // Add Express app as middleware BEFORE other middleware
      // This ensures API routes are handled before Vite's own routing
      server.middlewares.use("/api", app);

      // Also handle the root path through Express for catch-all routes
      server.middlewares.use((req, res, next) => {
        // If it's not an API request and not a static file, let Vite handle it
        if (req.url.startsWith("/api/") || req.url.startsWith("/.")) {
          return app(req, res, next);
        }
        next();
      });

      return () => {
        // Server is configured
      };
    },
  };
}
