import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Download,
  ChevronDown,
  Pause,
  Play,
  Loader,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createApiUrl } from "@/config/api";

type Step = "email" | "verification" | "videos";

interface DatabaseVideo {
  id: number;
  email: string;
  video_url: string | null;
  duration: number;
  resolution: string;
  status: "processing" | "completed" | "failed";
  error_message?: string;
  created_at: string;
  expires_at: string;
  request_id?: string;
  payment_intent_id?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_status?: string;
  payment_method_type?: string;
  payment_email?: string;
}

interface MyVideosProps {
  onBack?: () => void;
}

export default function MyVideos({ onBack }: MyVideosProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [checkingSMTP, setCheckingSMTP] = useState(true);

  // Check SMTP status and load saved email from localStorage on mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const response = await fetch(createApiUrl("/api/auth/smtp-status"), {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          setSmtpEnabled(
            data.enabled === true || data.requiresVerification === true,
          );
        } else {
          // If endpoint returns error, assume SMTP is not configured
          setSmtpEnabled(false);
        }
      } catch (err) {
        // Network error or timeout - assume SMTP is not configured
        console.debug("SMTP check skipped (endpoint not available)");
        setSmtpEnabled(false);
      } finally {
        setCheckingSMTP(false);
      }
    };

    const savedEmail = localStorage.getItem("fashionai_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }

    initializeComponent();
  }, []);

  // Poll for video status updates
  useEffect(() => {
    if (step === "videos" && videos.length > 0) {
      const hasProcessing = videos.some((v) => v.status === "processing");

      if (hasProcessing) {
        // Poll every 5 seconds for processing videos
        const interval = setInterval(async () => {
          try {
            const response = await fetch(createApiUrl("/api/videos"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
              signal: AbortSignal.timeout(5000),
            });
            if (response.ok) {
              const data = await response.json();
              setVideos(data.videos || []);
            }
          } catch (err) {
            console.debug("Error polling video status", err);
          }
        }, 5000);

        setPollInterval(interval);
        return () => clearInterval(interval);
      }
    }
  }, [step, videos, email]);

  const handleEmailSubmit = async () => {
    if (!email) return;

    setLoading(true);
    setError(null);

    // If SMTP is enabled, send verification code
    if (smtpEnabled) {
      try {
        const response = await fetch(createApiUrl("/api/auth/send-code"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send verification code");
        }

        setStep("verification");
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to send verification code",
        );
        setLoading(false);
      }
    } else {
      // SMTP not enabled, directly load videos
      try {
        // Check for any pending videos and update their status in the background
        await fetch(createApiUrl("/api/check-pending"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        // Then fetch all videos (will include any that just completed)
        const response = await fetch(createApiUrl("/api/videos"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data = await response.json();
        const userVideos = data.videos || [];

        setVideos(userVideos);
        setStep("videos");
        if (userVideos.length > 0) {
          setCurrentVideoIndex(0);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load videos. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCodeSubmit = async () => {
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      // Verify the code
      const verifyResponse = await fetch(
        createApiUrl("/api/auth/verify-code"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        },
      );

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Verification failed");
      }

      // Code verified, now fetch videos
      await fetch(createApiUrl("/api/check-pending"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      const response = await fetch(createApiUrl("/api/videos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const data = await response.json();
      const userVideos = data.videos || [];

      setVideos(userVideos);
      setStep("videos");
      if (userVideos.length > 0) {
        setCurrentVideoIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
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

  // Don't render until SMTP status is checked
  if (checkingSMTP) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 text-white animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate("/");
              }
            }}
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
                Enter your email to view your generated fashion videos
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && !loading) {
                      handleEmailSubmit();
                    }
                  }}
                  disabled={loading}
                  className="h-12 text-base bg-gray-900 border-gray-800 text-white"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <Button
                disabled={!email || loading}
                onClick={handleEmailSubmit}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12 text-base disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load My Videos"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    navigate("/");
                  }
                }}
                className="w-full text-gray-400 hover:text-white hover:bg-gray-900"
              >
                Back to Home
              </Button>

              <p className="text-xs text-gray-500 text-center mt-6">
                Use the same email you used to generate videos
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Code Verification Step - Only shown if SMTP is enabled */}
      {smtpEnabled && step === "verification" && (
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
                Verify Email
              </h2>
              <p className="text-gray-400 text-lg">
                Enter the code sent to {email}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && code.length === 6 && !loading) {
                      handleCodeSubmit();
                    }
                  }}
                  maxLength={6}
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
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
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
                Check your spam folder if you don't see the email
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Videos Step - TikTok Style */}
      {step === "videos" && (
        <section className="min-h-screen bg-black flex items-center justify-center py-12 overflow-hidden">
          {videos.length === 0 ? (
            <div className="relative w-full h-screen bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20 flex items-center justify-center overflow-hidden">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80" />

              {/* Content */}
              <div className="relative z-10 w-full max-w-2xl px-4 md:px-8 text-center">
                <div className="mb-8">
                  <Sparkles className="w-16 h-16 mx-auto mb-6 text-white/80 drop-shadow-lg" />
                </div>

                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                  No Videos Yet
                </h2>

                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto drop-shadow-md">
                  You haven't generated any videos yet. Create your first AI
                  fashion video now!
                </p>

                <div className="space-y-4">
                  <Button
                    onClick={() => navigate("/")}
                    className="bg-white hover:bg-gray-100 text-black font-semibold h-14 px-8 text-lg md:h-16 md:px-12 md:text-xl"
                  >
                    Start Generating
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep("email");
                      setEmail("");
                      setVideos([]);
                    }}
                    className="text-gray-300 hover:text-white hover:bg-white/10 h-12"
                  >
                    Use Different Email
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="relative w-full h-screen bg-black flex items-center justify-center"
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
            >
              {/* Video Container */}
              <div className="relative w-full h-full md:w-[500px] md:h-screen bg-black flex items-center justify-center">
                {/* Current Video */}
                {currentVideo && (
                  <div className="relative w-full h-full">
                    {currentVideo.status === "processing" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="animate-spin mb-6">
                          <Loader className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Generating Video
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Your video is being created. This may take a few
                          moments...
                        </p>
                      </div>
                    ) : currentVideo.status === "failed" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-950 to-black p-6">
                        <svg
                          className="w-16 h-16 text-red-500 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Generation Failed
                        </h3>
                        <p className="text-red-300 text-sm mb-6 text-center">
                          {currentVideo.error_message ||
                            "Sorry, the video generation failed. Please try again."}
                        </p>
                        <Button
                          onClick={() => navigate("/generate")}
                          className="bg-white hover:bg-gray-100 text-black font-semibold h-10 px-6"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <video
                          src={currentVideo.video_url || ""}
                          className="w-full h-full object-cover"
                          autoPlay={isPlaying}
                          loop
                          muted
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

                        {/* Video Info Bottom */}
                        <div className="absolute bottom-32 left-0 right-0 px-6 text-white z-10">
                          <div className="flex gap-2 mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                              {currentVideo.duration}s
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                              {currentVideo.resolution}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Created{" "}
                            {new Date(
                              currentVideo.created_at,
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Expires{" "}
                            {new Date(
                              currentVideo.expires_at,
                            ).toLocaleDateString()}
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

                        {/* Navigation Buttons - Previous/Next */}
                        {videos.length > 1 && (
                          <>
                            {/* Previous Button */}
                            <button
                              onClick={() =>
                                setCurrentVideoIndex(
                                  (prev) =>
                                    (prev - 1 + videos.length) % videos.length,
                                )
                              }
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-3 rounded-full transition-all z-20"
                              aria-label="Previous video"
                            >
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>

                            {/* Next Button */}
                            <button
                              onClick={() =>
                                setCurrentVideoIndex(
                                  (prev) => (prev + 1) % videos.length,
                                )
                              }
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-3 rounded-full transition-all z-20"
                              aria-label="Next video"
                            >
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Download Button */}
                        <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
                          <Button
                            className="w-full bg-white hover:bg-gray-100 text-black font-semibold flex items-center justify-center gap-2 h-12"
                            onClick={() => {
                              if (currentVideo.video_url) {
                                const a = document.createElement("a");
                                a.href = currentVideo.video_url;
                                a.download = `video-${currentVideo.id}.mp4`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Pagination Indicator */}
                    <div className="absolute top-8 left-0 right-0 px-6 text-white z-20">
                      <p className="text-sm text-gray-300 text-center">
                        {currentVideoIndex + 1} of {videos.length}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute top-16 left-0 right-0 px-6 z-20">
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all"
                          style={{
                            width: `${((currentVideoIndex + 1) / videos.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Scroll Indicator */}
                    {videos.length > 1 && (
                      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white z-20 animate-bounce">
                        <ChevronDown className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
