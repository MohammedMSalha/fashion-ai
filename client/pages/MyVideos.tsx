import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Pause, Play, Loader } from "lucide-react";
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
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          setSmtpEnabled(
            data.enabled === true || data.requiresVerification === true,
          );
        } else {
          setSmtpEnabled(false);
        }
      } catch (err) {
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
        const interval = setInterval(async () => {
          try {
            const response = await fetch(createApiUrl("/api/videos"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            if (response.ok) {
              const data = await response.json();
              setVideos(data.videos || []);
            }
          } catch (err) {
            console.error("Error polling video status:", err);
          }
        }, 10000);

        setPollInterval(interval);
        return () => clearInterval(interval);
      }
    }
  }, [step, videos, email]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (smtpEnabled) {
        const response = await fetch(createApiUrl("/api/auth/send-code"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error("Failed to send verification code");
        }

        setStep("verification");
      } else {
        localStorage.setItem("fashionai_email", email);
        await handleLoadVideos();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(createApiUrl("/api/auth/verify-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        throw new Error("Invalid verification code");
      }

      localStorage.setItem("fashionai_email", email);
      await handleLoadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(createApiUrl("/api/videos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to load videos");
      }

      const data = await response.json();
      setVideos(data.videos || []);
      setStep("videos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Filter videos to show only those being generated or already generated
  const filteredVideos = videos.filter(
    (v) =>
      (v.status === "processing" && v.request_id) ||
      (v.status === "completed" && v.video_url)
  );

  const currentVideo = filteredVideos[currentVideoIndex];

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 z-30">
        <button
          onClick={() => {
            if (step === "videos") {
              setStep("email");
              setEmail("");
              setCode("");
              setVideos([]);
              setCurrentVideoIndex(0);
            } else if (onBack) {
              onBack();
            } else {
              navigate("/");
            }
          }}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold text-white">My Videos</h1>
        <div className="w-12"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {step === "email" ? (
          // Email Input Screen
          <div className="w-full h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-white">Your Videos</h2>
                <p className="text-gray-400">
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
                    onKeyPress={(e) => e.key === "Enter" && handleEmailSubmit()}
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-12"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-950 border border-red-700 rounded-lg p-3">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleEmailSubmit}
                  disabled={loading || !email}
                  className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold transition"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load My Videos"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Use the same email you used to generate videos
              </p>
            </div>
          </div>
        ) : step === "verification" ? (
          // Verification Code Screen
          <div className="w-full h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-white">Verify Email</h2>
                <p className="text-gray-400">Enter the code sent to {email}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCodeSubmit()}
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-12 text-center text-2xl tracking-widest"
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-950 border border-red-700 rounded-lg p-3">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleCodeSubmit}
                  disabled={loading || !code}
                  className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold transition"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : videos.length === 0 ? (
          // No Videos Screen
          <div className="w-full h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">No Videos Yet</h2>
              <p className="text-gray-400">
                You haven't generated any videos yet. Start by creating your
                first AI fashion video!
              </p>
              <Button
                onClick={() => navigate("/")}
                className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold transition mt-4"
              >
                Create Video
              </Button>
            </div>
          </div>
        ) : (
          // TikTok-style Video Feed
          <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
            {/* Main Video Area - TikTok 9:16 aspect ratio */}
            <div className="relative w-full max-w-md aspect-[9/16]">
              {currentVideo.status === "processing" ? (
                // Loading State
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="animate-spin mb-6">
                    <Loader className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Generating Video
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Your video is being created...
                  </p>
                </div>
              ) : currentVideo.status === "failed" ? (
                // Error State
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
                      "Sorry, the video generation failed."}
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="bg-white hover:bg-gray-100 text-black font-semibold h-10 px-6"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                // Video Content
                <>
                  <video
                    src={currentVideo.video_url || ""}
                    className="w-full h-full object-cover"
                    autoPlay={isPlaying}
                    loop
                    muted
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

                  {/* Center Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 backdrop-blur-sm p-4 rounded-full transition-all z-20"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white" />
                    )}
                  </button>

                  {/* Left Navigation */}
                  {videos.length > 1 && (
                    <button
                      onClick={() =>
                        setCurrentVideoIndex(
                          (prev) => (prev - 1 + videos.length) % videos.length,
                        )
                      }
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 backdrop-blur-sm p-3 rounded-full transition-all z-20"
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
                  )}

                  {/* Right Navigation */}
                  {videos.length > 1 && (
                    <button
                      onClick={() =>
                        setCurrentVideoIndex(
                          (prev) => (prev + 1) % videos.length,
                        )
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 backdrop-blur-sm p-3 rounded-full transition-all z-20"
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
                  )}

                  {/* Video Info - Bottom Left */}
                  <div className="absolute bottom-24 left-0 right-0 px-6 text-white z-10 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold mb-1">
                          Created
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(currentVideo.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold mb-1">
                          Expires
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(currentVideo.expires_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-gray-200 border border-gray-600">
                        {currentVideo.duration}s
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-gray-200 border border-gray-600">
                        {currentVideo.resolution}
                      </span>
                    </div>
                  </div>

                  {/* Video Counter - Top */}
                  {videos.length > 1 && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-white z-20">
                      <p className="text-sm font-medium bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                        {currentVideoIndex + 1} / {videos.length}
                      </p>
                    </div>
                  )}

                  {/* Download Button - Bottom Center */}
                  <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
                    <Button
                      className="w-full bg-white hover:bg-gray-100 text-black font-bold h-12 flex items-center justify-center gap-2 rounded-lg transition-all shadow-lg"
                      onClick={() => {
                        if (currentVideo.video_url) {
                          const a = document.createElement("a");
                          a.href = currentVideo.video_url;
                          a.download = `fashion-video-${currentVideo.id}.mp4`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }}
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
