let cachedApp: any = null;

async function getApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Import the server module - it exports createServer function
    const serverModule = await import("../server/index.ts");
    const { createServer } = serverModule;
    
    // Create the Express app
    cachedApp = await createServer();
    console.log("[API] Express app created and cached");
    
    return cachedApp;
  } catch (error) {
    console.error("[API] Failed to load server:", error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  try {
    console.log("[API] Request:", req.method, req.url);
    
    // Get the Express app (cached after first request)
    const app = await getApp();
    
    // Invoke the Express app as a request handler
    return new Promise<void>((resolve) => {
      // Handle the response
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;
      
      let completed = false;
      
      const complete = () => {
        if (!completed) {
          completed = true;
          resolve();
        }
      };
      
      // Override response methods to detect completion
      res.send = function(data: any) {
        complete();
        return originalSend.call(this, data);
      };
      
      res.json = function(data: any) {
        complete();
        return originalJson.call(this, data);
      };
      
      res.end = function(...args: any[]) {
        complete();
        return originalEnd.apply(this, args);
      };
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(complete, 29000);
      
      res.on("finish", () => {
        clearTimeout(timeout);
        complete();
      });
      
      // Call the Express app
      try {
        app(req, res, (err?: any) => {
          clearTimeout(timeout);
          if (err) {
            console.error("[API] Middleware error:", err);
            complete();
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error("[API] Express error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Server error" });
        }
        complete();
      }
    });
  } catch (error) {
    console.error("[API] Handler error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
