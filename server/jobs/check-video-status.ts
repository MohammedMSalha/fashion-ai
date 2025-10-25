import { checkAndUpdateAllPendingVideos } from "../services/video-status.js";

let jobStarted = false;
let jobInterval: NodeJS.Timeout | null = null;

export function startVideoStatusCheckJob() {
  // Only start the job once, even if createServer() is called multiple times
  if (jobStarted) {
    console.log(
      "[VideoStatusJob] Job already started, skipping duplicate initialization",
    );
    return;
  }

  jobStarted = true;

  // Start the polling job
  jobInterval = setInterval(async () => {
    try {
      console.log(
        `[VideoStatusJob] ${new Date().toISOString()} - Checking for pending video generations...`,
      );
      await checkAndUpdateAllPendingVideos();
    } catch (error) {
      console.error("[VideoStatusJob] Error during status check:", error);
    }
  }, 10000); // 10 seconds

  console.log(
    "[VideoStatusJob] Started! Will check for pending videos every 10 seconds",
  );
}

// Optional: graceful shutdown
export function stopVideoStatusCheckJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    jobStarted = false;
    console.log("[VideoStatusJob] Stopped");
  }
}
