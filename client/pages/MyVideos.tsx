import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, ChevronDown, Pause, Play, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Step = "email" | "verification" | "videos";

interface DatabaseVideo {
  id: number;
  email: string;
  video_url: string;
  duration: number;
  resolution: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function MyVideos() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = () => {
    if (email) {
      setStep("verification");
    }
  };

  const handleCodeSubmit = async () => {
    if (code) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/videos/${encodeURIComponent(email)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }
        const data = await response.json();
        setVideos(data.videos || []);
        if (!data.videos || data.videos.length === 0) {
          setError("No videos found for this email");
        } else {
          setStep("videos");
          setCurrentVideoIndex(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load videos");
      } finally {
        setLoading(false);
      }
    }
  };

  const currentVideo = videos.length > 0 ? videos[currentVideoIndex] : null;

  const handleNextVideo = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const handlePrevVideo = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) =>
        prev === 0 ? videos.length - 1 : prev - 1,
      );
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleNextVideo();
    } else {
      handlePrevVideo();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const handleTouchEnd = (endEvent: React.TouchEvent) => {
      const endY = endEvent.changedTouches[0].clientY;
      if (startY - endY > 50) {
        handleNextVideo();
      } else if (endY - startY > 50) {
        handlePrevVideo();
      }
    };
    e.currentTarget.addEventListener("touchend", handleTouchEnd as any, {
      once: true,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:bg-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            My Videos
          </h1>
          <div className="w-12"></div>
        </div>
      </nav>

      {/* Email Step */}
      {step === "email" && (
        <section className="min-h-screen bg-black flex items-center justify-center py-12">
          <div className="w-full max-w-md px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-6 border border-gray-800">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Your Videos
              </h2>
              <p className="text-gray-400 text-lg">
                Sign in to view your generated fashion videos
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <Button
                disabled={!email}
                onClick={handleEmailSubmit}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12 text-base"
              >
                Proceed
              </Button>

              <p className="text-xs text-gray-500 text-center mt-6">
                We'll send you a verification code
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Code Verification Step */}
      {step === "verification" && (
        <section className="min-h-screen bg-black flex items-center justify-center py-12">
          <div className="w-full max-w-md px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-6 border border-gray-800">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Verify Code
              </h2>
              <p className="text-gray-400 text-lg">
                Check your email for the verification code
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength="6"
                  disabled={loading}
                  className="h-12 text-base bg-gray-900 border-gray-800 text-white text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <Button
                disabled={code.length !== 6 || loading}
                onClick={handleCodeSubmit}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12 text-base disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading Videos...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                disabled={loading}
                className="w-full text-gray-400 hover:text-white hover:bg-gray-900"
              >
                Back
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Didn't receive code? Check spam folder or try again.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Videos Step - TikTok Style */}
      {step === "videos" && (
        <section className="min-h-screen bg-black flex items-center justify-center py-12 overflow-hidden">
          <div
            className="relative w-full h-screen bg-black flex items-center justify-center"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
          >
            {/* Video Container */}
            <div className="relative w-full h-full md:w-[500px] md:h-screen bg-black flex items-center justify-center">
              {/* Current Video */}
              <div className="relative w-full h-full">
                <img
                  src={currentVideo.thumbnail}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

                {/* Video Info Bottom */}
                <div className="absolute bottom-32 left-0 right-0 px-6 text-white z-10">
                  <h3 className="text-2xl font-bold mb-3">
                    {currentVideo.title}
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {currentVideo.duration}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {currentVideo.quality}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Created{" "}
                    {new Date(currentVideo.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-4 rounded-full transition-all z-20"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white" />
                  )}
                </button>

                {/* Download Button */}
                <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
                  <Button
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold flex items-center justify-center gap-2 h-12"
                    onClick={() => window.open(currentVideo.downloadUrl)}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                {/* Pagination Indicator */}
                <div className="absolute top-8 left-0 right-0 px-6 text-white z-20">
                  <p className="text-sm text-gray-300 text-center">
                    {currentVideoIndex + 1} of {SAMPLE_VIDEOS.length}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="absolute top-16 left-0 right-0 px-6 z-20">
                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{
                        width: `${(currentVideoIndex / SAMPLE_VIDEOS.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white z-20 animate-bounce">
                  <ChevronDown className="w-6 h-6" />
                </div>
              </div>

              {/* Side Buttons */}
              <div className="hidden lg:flex absolute right-6 top-1/2 transform -translate-y-1/2 flex-col gap-8 z-20">
                <a
                  href="#"
                  className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center hover:bg-white/10">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs">Contact</span>
                </a>

                <a
                  href="#"
                  className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center hover:bg-white/10">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs">Terms</span>
                </a>

                <a
                  href="#"
                  className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center hover:bg-white/10">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs">Privacy</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
