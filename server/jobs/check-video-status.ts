import cron from "node-cron";
import { checkAndUpdateAllPendingVideos } from "../services/video-status";

export function startVideoStatusCheckJob() {
  // Check every 5 minutes for pending videos
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Checking for pending video generations...");
      await checkAndUpdateAllPendingVideos();
    } catch (error) {
      console.error("Video status check job error:", error);
    }
  });

  console.log("Video status check job started (runs every 5 minutes)");
}
