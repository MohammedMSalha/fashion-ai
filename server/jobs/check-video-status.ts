import cron from "node-cron";
import { checkAndUpdateAllPendingVideos } from "../services/video-status.js";

export function startVideoStatusCheckJob() {
  // Check every 10 seconds for pending videos
  // Using setInterval instead of cron for more precise timing
  setInterval(async () => {
    try {
      console.log(`[VideoStatusJob] ${new Date().toISOString()} - Checking for pending video generations...`);
      await checkAndUpdateAllPendingVideos();
    } catch (error) {
      console.error("[VideoStatusJob] Error during status check:", error);
    }
  }, 10000); // 10 seconds

  console.log("[VideoStatusJob] Started! Will check for pending videos every 10 seconds");
}
