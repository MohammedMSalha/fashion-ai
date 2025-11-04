import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoSlider from "@/components/VideoSlider";
import SmartVideoForm from "@/components/SmartVideoForm";
import ApiKeyModal from "@/components/ApiKeyModal";
import MyVideos from "./MyVideos";
import { useToast } from "@/hooks/use-toast";
import { createApiUrl } from "@/config/api";
import {
  Sparkles,
  X,
  Mail,
  FileText,
  Lock,
  Play,
  Info,
  Download,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

type Page =
  | "home"
  | "generate"
  | "my-videos"
  | "contact"
  | "terms"
  | "privacy"
  | "about"
  | "in-progress"
  | "video-preview";

interface Video {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  quality: string;
  createdAt: string;
  downloadUrl: string;
}

const SAMPLE_VIDEOS: Video[] = [
  {
    id: "1",
    thumbnail: "/videos/monkey1.mp4",
    title: "Playful Monkey",
    duration: "10s",
    quality: "1080p",
    createdAt: "2024-01-15",
    downloadUrl: "/videos/monkey1.mp4",
  },
  {
    id: "2",
    thumbnail: "/videos/tiger.mp4",
    title: "Majestic Tiger",
    duration: "10s",
    quality: "1080p",
    createdAt: "2024-01-10",
    downloadUrl: "/videos/tiger.mp4",
  },
  {
    id: "3",
    thumbnail: "/videos/zebra.mp4",
    title: "Striped Zebra",
    duration: "10s",
    quality: "1080p",
    createdAt: "2024-01-08",
    downloadUrl: "/videos/zebra.mp4",
  },
  {
    id: "4",
    thumbnail: "/videos/monkey2.mp4",
    title: "Wild Monkey Moves",
    duration: "10s",
    quality: "1080p",
    createdAt: "2024-01-05",
    downloadUrl: "/videos/monkey2.mp4",
  },
  {
    id: "5",
    thumbnail: "/videos/elephant.mp4",
    title: "Gentle Elephant",
    duration: "10s",
    quality: "1080p",
    createdAt: "2024-01-01",
    downloadUrl: "/videos/elephant.mp4",
  },
];

export default function Index() {
  const { toast } = useToast();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Check if we're on the /generate route
    if (location.pathname === "/generate") {
      return "generate";
    }
    // Check if we're on the /my-videos route
    if (location.pathname === "/my-videos") {
      return "my-videos";
    }
    return "home";
  });
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<Video | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showExpiryAlert, setShowExpiryAlert] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Poll video status when in-progress (after payment)
  useEffect(() => {
    if (currentPage !== "in-progress") {
      return;
    }

    const videoId = sessionStorage.getItem("fashionai_videoId");
    if (!videoId) {
      console.warn("[Loading] No videoId found in sessionStorage");
      return;
    }

    console.log("[Loading] Starting polling for videoId:", videoId);

    // Poll video status until generation is complete
    const pollVideoStatus = async () => {
      const maxAttempts = 120; // Max 10 minutes
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          console.log(
            `[Loading] Polling attempt ${attempts + 1}/${maxAttempts} - Checking status for videoId: ${videoId}`,
          );
          const response = await fetch(
            createApiUrl(`/api/video-status/${videoId}`),
          );

          // 404 is OK - video record being created, keep polling
          if (response.status === 404) {
            console.log(
              "[Loading] Video record not found yet (404) - waiting for webhook to process...",
            );
            await new Promise((resolve) => setTimeout(resolve, 10000));
            attempts++;
            continue;
          }

          if (!response.ok) {
            console.error(
              `[Loading] API error: ${response.status} ${response.statusText}`,
            );
            // Continue polling on other errors too
            await new Promise((resolve) => setTimeout(resolve, 10000));
            attempts++;
            continue;
          }

          const data = await response.json();

          if (!data.video) {
            if (data.error === "Video record not found") {
              console.error("[Loading] ✗ Video record does not exist!");
              console.error("[Loading] Debug info:", data._debug);
              toast({
                title: "Video Not Found",
                description:
                  "Video record wasn't created. Please upload your image and try again.",
                variant: "destructive",
              });
              setCurrentPage("generate");
              sessionStorage.removeItem("fashionai_videoId");
              break;
            }
            console.log(
              "[Loading] No video data in response, continuing to poll...",
            );
            await new Promise((resolve) => setTimeout(resolve, 10000));
            attempts++;
            continue;
          }

          console.log("[Loading] Video status:", data.video?.status);
          console.log("[Loading] Full response:", data);

          if (data.video?.status === "completed") {
            console.log("[Loading] ✓ Video generation complete!");
            console.log(
              "[Loading] Full video data:",
              JSON.stringify(data.video),
            );

            // Transform database video to Video interface format
            const dbVideo = data.video;

            if (!dbVideo.video_url) {
              console.error(
                "[Loading] ✗ ERROR: video_url is missing from database!",
              );
              console.error("[Loading] Database record:", dbVideo);
              // Keep polling - video URL might be saved in next check
              await new Promise((resolve) => setTimeout(resolve, 10000));
              attempts++;
              continue;
            }

            const videoData: Video = {
              id: String(dbVideo.id),
              thumbnail: dbVideo.video_url,
              title: `AI Fashion Video ${dbVideo.id}`,
              duration: `${dbVideo.duration}s`,
              quality: dbVideo.resolution || "1080p",
              createdAt: new Date(dbVideo.created_at)
                .toISOString()
                .split("T")[0],
              downloadUrl: dbVideo.video_url,
            };

            console.log("[Loading] Setting video data:", videoData);
            setGeneratedVideo(videoData);
            setCurrentPage("video-preview");
            sessionStorage.removeItem("fashionai_videoId");
            break;
          }

          if (data.video?.status === "failed") {
            console.error("[Loading] ✗ Video generation failed");
            toast({
              title: "Generation Failed",
              description:
                data.video?.error_message || "Failed to generate video",
              variant: "destructive",
            });
            setCurrentPage("generate");
            sessionStorage.removeItem("fashionai_videoId");
            break;
          }

          // Still processing, wait and try again
          console.log("[Loading] Still processing, waiting 10 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 10000));
          attempts++;
        } catch (error) {
          console.error("[Loading] Error checking video status:", error);
          // Continue polling even on error
          await new Promise((resolve) => setTimeout(resolve, 10000));
          attempts++;
        }
      }

      // Timeout after 10 minutes
      if (attempts >= maxAttempts) {
        console.error("[Loading] Video generation timeout");
        toast({
          title: "Timeout",
          description: "Video generation took too long. Please try again.",
          variant: "destructive",
        });
        setCurrentPage("generate");
        sessionStorage.removeItem("fashionai_videoId");
      }
    };

    pollVideoStatus();
  }, [currentPage, toast]);

  const handleGenerateClick = useCallback(() => {
    setCurrentPage("in-progress");
    // Polling will handle the transition to video-preview when ready
  }, []);

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) =>
      prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1,
    );
  };

  const goHome = () => {
    setCurrentPage("home");
    setGeneratedVideo(null); // Reset generated video when going home
  };

  const currentVideo = SAMPLE_VIDEOS[currentVideoIndex];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* HOME PAGE */}
      {currentPage === "home" && (
        <section className="relative w-full h-full">
          <VideoSlider />

          {/* CTA Section */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-16 md:pt-24 pb-8 md:pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Create Your Own AI Fashion Video
              </h2>

              <div className="mb-6 md:mb-8 inline-block bg-gray-900 border border-gray-800 rounded-full px-4 md:px-6 py-2 md:py-3">
                <p className="text-gray-300 text-xs md:text-sm lg:text-base">
                  <span className="text-white font-bold">$0.60-$1.20</span> per
                  video • No subscription • No credits
                </p>
              </div>

              <p className="text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto text-base md:text-lg">
                Transform your photos into professional fashion videos
              </p>
              <Button
                onClick={() => setCurrentPage("generate")}
                className="bg-white text-black hover:bg-gray-100 font-bold text-base md:text-lg px-8 md:px-12 py-5 md:py-6 rounded-lg"
              >
                Start Generating
              </Button>
            </div>
          </div>

          {/* Overlay to close menu when clicking outside */}
          {showFabMenu && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowFabMenu(false)}
            />
          )}

          {/* Floating Action Button Menu */}
          {/* Backdrop when menu is open */}
          {showFabMenu && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setShowFabMenu(false)}
            />
          )}

          <div className="fixed bottom-4 left-4 md:bottom-6 md:right-6 md:left-auto z-40">
            {/* Menu Items Container */}
            <div
              className={`flex flex-col gap-2 md:gap-3 mb-4 transition-all duration-300 origin-bottom ${
                showFabMenu
                  ? "opacity-100 visible scale-100"
                  : "opacity-0 invisible scale-95"
              }`}
            >
              <button
                onClick={() => {
                  setCurrentPage("my-videos");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-white hover:bg-blue-50 text-black px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-full font-semibold transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                title="My Videos"
              >
                <Play className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-sm md:text-sm font-medium inline">
                  My Videos
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("about");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                title="About Us"
              >
                <Info className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-sm md:text-sm font-medium inline">
                  About Us
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("contact");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                title="Contact"
              >
                <Mail className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-sm md:text-sm font-medium inline">
                  Contact
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("terms");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                title="Terms"
              >
                <FileText className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-sm md:text-sm font-medium inline">
                  Terms
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("privacy");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                title="Privacy"
              >
                <Lock className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-sm md:text-sm font-medium inline">
                  Privacy
                </span>
              </button>
            </div>

            {/* Main FAB Button */}
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                showFabMenu
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100 text-black"
              }`}
              title="Menu"
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </section>
      )}

      {/* GENERATE PAGE */}
      {currentPage === "generate" && (
        <section className="relative w-full h-full bg-black overflow-y-auto">
          {/* Header with Back Button */}
          <div className="sticky top-0 bg-black border-b border-gray-800 p-4 z-20">
            <div className="flex items-center justify-between max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <button
                onClick={goHome}
                className="text-white hover:text-gray-300 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Generate Video
              </h2>
              <div className="w-20"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full py-12 md:py-16">
            <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12">
              {/* Info Box */}
              <div className="mb-10 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-gray-200 text-lg">
                    <span className="text-white font-bold text-xl">
                      $0.60-$1.20
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    <span className="text-white font-semibold">
                      No subscription. No credits.
                    </span>{" "}
                    Just pay once per video.
                  </p>
                </div>
              </div>

              {/* Smart Form */}
              <SmartVideoForm onGenerate={handleGenerateClick} />
            </div>
          </div>
        </section>
      )}

      {/* IN-PROGRESS PAGE */}
      {currentPage === "in-progress" && (
        <section className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-gray-800 border-t-white animate-spin"></div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Generating Video
            </h2>
            <p className="text-gray-400 mb-2">
              Creating your AI fashion video...
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 2-3 minutes
            </p>
          </div>
        </section>
      )}

      {/* WAITING FOR VIDEO TO BE GENERATED - Show loading screen */}
      {currentPage === "video-preview" && !generatedVideo && (
        <section className="relative w-full h-full bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700 animate-spin border-t-white"></div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Generating Video
              </h2>
              <p className="text-gray-400">Creating your AI fashion video...</p>
              <p className="text-sm text-gray-500 mt-4">
                This may take 2-3 minutes
              </p>
            </div>
          </div>
        </section>
      )}

      {/* VIDEO PREVIEW PAGE - TikTok Style */}
      {currentPage === "video-preview" &&
        generatedVideo &&
        generatedVideo.downloadUrl && (
          <section className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Back Button */}
            <button
              onClick={goHome}
              className="absolute top-4 left-4 z-20 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Video Container */}
            <div className="relative w-full h-full md:w-[500px] md:h-full bg-black flex items-center justify-center">
              {/* Generated Video */}
              <div className="relative w-full h-full">
                <video
                  src={generatedVideo.thumbnail}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                {/* 48-hour Expiry Alert */}
                {showExpiryAlert && (
                  <div className="absolute top-8 left-0 right-0 px-6 z-20">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-white flex-1">
                        <p className="font-semibold">
                          Video expires in 48 hours
                        </p>
                        <p className="text-xs text-gray-300">
                          Download now to save permanently
                        </p>
                      </div>
                      <button
                        onClick={() => setShowExpiryAlert(false)}
                        className="text-gray-400 hover:text-white transition flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Video Info */}
                <div className="absolute bottom-24 left-0 right-0 px-6 text-white z-10">
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {generatedVideo.duration}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {generatedVideo.quality}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
                  <Button
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12 flex items-center justify-center gap-2"
                    onClick={async () => {
                      if (generatedVideo.downloadUrl) {
                        try {
                          const response = await fetch(
                            generatedVideo.downloadUrl,
                          );
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `fashion-video-${generatedVideo.id}.mp4`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (error) {
                          console.error("Download failed:", error);
                          const a = document.createElement("a");
                          a.href = generatedVideo.downloadUrl;
                          a.download = `fashion-video-${generatedVideo.id}.mp4`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }
                    }}
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </Button>
                </div>

                {/* Progress Bar Overlay */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-20">
                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* MY VIDEOS PAGE */}
      {currentPage === "my-videos" && (
        <section className="fixed inset-0 bg-black">
          <MyVideos onBack={() => setCurrentPage("home")} />
        </section>
      )}

      {/* CONTACT PAGE */}
      {currentPage === "contact" && (
        <section className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={goHome}
            className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center w-full max-w-md px-4">
            <h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-6">Get in touch with our team</p>
            <Button className="bg-white hover:bg-gray-100 text-black font-semibold">
              Email: support@fashionai.com
            </Button>
          </div>
        </section>
      )}

      {/* TERMS PAGE */}
      {currentPage === "terms" && (
        <section className="relative w-full h-full overflow-y-auto">
          <button
            onClick={goHome}
            className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition z-20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="max-w-2xl mx-auto px-4 py-12 pt-16">
            <h2 className="text-3xl font-bold text-white mb-6">
              Terms of Service
            </h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong>
                  By using this service, you agree to our terms and conditions.
                </strong>
              </p>
              <p>
                <strong>Payment Terms:</strong> All payments are one-time,
                non-refundable charges.
              </p>
              <p>
                <strong>Content Rights:</strong> You own the videos generated
                using your photos.
              </p>
              <p>
                <strong>User Responsibility:</strong> You confirm you have the
                right to use provided images.
              </p>
              <p>© 2024 FashionAI. All rights reserved.</p>
            </div>
          </div>
        </section>
      )}

      {/* PRIVACY PAGE */}
      {currentPage === "privacy" && (
        <section className="relative w-full h-full overflow-y-auto">
          <button
            onClick={goHome}
            className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition z-20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="max-w-2xl mx-auto px-4 py-12 pt-16">
            <h2 className="text-3xl font-bold text-white mb-6">
              Privacy Policy
            </h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong>Data Collection:</strong> We collect emails to deliver
                videos and manage your account.
              </p>
              <p>
                <strong>Image Security:</strong> Your photos are used only for
                video generation and deleted after processing.
              </p>
              <p>
                <strong>No Tracking:</strong> We do not track your behavior or
                share data with third parties.
              </p>
              <p>
                <strong>Payment Privacy:</strong> Payment processing is handled
                securely by Stripe.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ABOUT PAGE */}
      {currentPage === "about" && (
        <section className="relative w-full h-full overflow-y-auto">
          <button
            onClick={goHome}
            className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition z-20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="max-w-2xl mx-auto px-4 py-12 pt-16">
            <h2 className="text-3xl font-bold text-white mb-6">About Us</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                <strong className="text-white">FashionAI</strong> is a
                cutting-edge platform that leverages artificial intelligence to
                transform fashion photography.
              </p>
              <p>
                We believe that everyone deserves access to professional-quality
                fashion content. Our mission is to make AI-generated fashion
                videos affordable, accessible, and easy to create.
              </p>
              <p>
                <strong className="text-white">Our Technology:</strong> We use
                advanced AI models to analyze clothing and create realistic
                fashion videos.
              </p>
              <p>
                <strong className="text-white">Why Choose Us?</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>No subscriptions or hidden fees</li>
                <li>Fast processing and instant delivery</li>
                <li>Multiple quality and duration options</li>
                <li>Privacy-focused platform</li>
                <li>Affordable pricing ($0.60-$1.20 per video)</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
