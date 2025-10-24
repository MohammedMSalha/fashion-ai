import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoSlider from "@/components/VideoSlider";
import VideoGeneratorForm from "@/components/VideoGeneratorForm";
import { Sparkles, X, Mail, FileText, Lock, Play, Info, Download, ArrowLeft, AlertCircle } from "lucide-react";

type Page = "home" | "generate" | "my-videos" | "contact" | "terms" | "privacy" | "about" | "in-progress" | "video-preview";
type MyVideosStep = "email" | "verification" | "videos";

interface Video {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  quality: string;
  createdAt: string;
  downloadUrl: string;
}

interface MousePosition {
  x: number;
  y: number;
}

const SAMPLE_VIDEOS: Video[] = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=900&fit=crop",
    title: "Summer Collection",
    duration: "5s",
    quality: "1080p",
    createdAt: "2024-01-15",
    downloadUrl: "#",
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1539571696357-5a69c006b15d?w=500&h=900&fit=crop",
    title: "Urban Style",
    duration: "10s",
    quality: "720p",
    createdAt: "2024-01-10",
    downloadUrl: "#",
  },
  {
    id: "3",
    thumbnail: "https://images.unsplash.com/photo-1595777707802-41d339d60b84?w=500&h=900&fit=crop",
    title: "Evening Wear",
    duration: "5s",
    quality: "1080p",
    createdAt: "2024-01-08",
    downloadUrl: "#",
  },
];

export default function Index() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [myVideosStep, setMyVideosStep] = useState<MyVideosStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [generatedVideo] = useState<Video>(SAMPLE_VIDEOS[0]);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (currentPage === "home") {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [currentPage]);

  const handleEmailSubmit = () => {
    if (email) setMyVideosStep("verification");
  };

  const handleCodeSubmit = () => {
    if (code) setMyVideosStep("videos");
  };

  const handleGenerateClick = () => {
    setCurrentPage("in-progress");
    // Simulate generation process
    setTimeout(() => {
      setCurrentPage("video-preview");
    }, 3000);
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) =>
      prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1
    );
  };

  const goHome = () => {
    setCurrentPage("home");
    setMyVideosStep("email");
    setEmail("");
    setCode("");
  };

  const currentVideo = SAMPLE_VIDEOS[currentVideoIndex];

  // Calculate mouse effect offset
  const moveX = (mousePos.x / window.innerWidth - 0.5) * 20;
  const moveY = (mousePos.y / window.innerHeight - 0.5) * 20;

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* HOME PAGE */}
      {currentPage === "home" && (
        <section className="relative w-full h-full">
          <VideoSlider />

          {/* Mouse tracking background effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transition-all duration-100"
              style={{
                top: `${50 + moveY}%`,
                left: `${50 + moveX}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* CTA Section */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-16 md:pt-24 pb-8 md:pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Create Your Own AI Fashion Video
              </h2>

              <div className="mb-6 md:mb-8 inline-block bg-gray-900 border border-gray-800 rounded-full px-4 md:px-6 py-2 md:py-3">
                <p className="text-gray-300 text-xs md:text-sm lg:text-base">
                  <span className="text-white font-bold">$0.40-$0.90</span> per video • No subscription • No credits
                </p>
              </div>

              <p className="text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto text-base md:text-lg">
                Upload a photo of yourself and let AI create stunning fashion videos
              </p>
              <Button
                onClick={() => setCurrentPage("generate")}
                className="bg-white text-black hover:bg-gray-100 font-bold text-base md:text-lg px-8 md:px-12 py-5 md:py-6 rounded-lg"
              >
                Start Generating
              </Button>
            </div>
          </div>

          {/* Floating Action Button Menu */}
          <div className="fixed bottom-8 right-8 z-40">
            <div
              className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${
                showFabMenu ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              <button
                onClick={() => {
                  setCurrentPage("my-videos");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-white hover:bg-gray-100 text-black px-4 py-3 rounded-full font-semibold transition-all"
              >
                <Play className="w-5 h-5" />
                <span className="text-sm">My Videos</span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("about");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
              >
                <Info className="w-5 h-5" />
                <span className="text-sm font-medium">About Us</span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("contact");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm font-medium">Contact</span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("terms");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Terms</span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage("privacy");
                  setShowFabMenu(false);
                }}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
              >
                <Lock className="w-5 h-5" />
                <span className="text-sm font-medium">Privacy</span>
              </button>
            </div>

            {/* Main FAB Button */}
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center shadow-lg transition-all hover:scale-110"
            >
              <Sparkles className="w-6 h-6" />
            </button>
          </div>
        </section>
      )}

      {/* GENERATE PAGE */}
      {currentPage === "generate" && (
        <section className="relative w-full h-full flex items-center justify-center overflow-y-auto">
          <button
            onClick={goHome}
            className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition z-20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="w-full max-w-2xl px-4 py-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Generate Video</h2>

            <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-center text-gray-300">
                <span className="text-white font-semibold">No subscription. No credits.</span> Just pay once per video.
              </p>
            </div>

            <VideoGeneratorForm onGenerate={handleGenerateClick} />
          </div>
        </section>
      )}

      {/* IN-PROGRESS PAGE */}
      {currentPage === "in-progress" && (
        <section className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-gray-800 border-t-white animate-spin">
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Generating Video</h2>
            <p className="text-gray-400 mb-2">Creating your AI fashion video...</p>
            <p className="text-sm text-gray-500">This usually takes 30-60 seconds</p>
          </div>
        </section>
      )}

      {/* VIDEO PREVIEW PAGE - TikTok Style */}
      {currentPage === "video-preview" && (
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
              <img
                src={generatedVideo.thumbnail}
                alt="Generated video"
                className="w-full h-full object-cover"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

              {/* 48-hour Expiry Alert */}
              <div className="absolute top-8 left-0 right-0 px-6 z-20">
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-100">
                    <p className="font-semibold">Video expires in 48 hours</p>
                    <p className="text-xs text-orange-200">Download now to save permanently</p>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="absolute bottom-24 left-0 right-0 px-6 text-white z-10">
                <p className="text-2xl font-bold mb-3">{generatedVideo.title}</p>
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
                  onClick={() => window.open(generatedVideo.downloadUrl)}
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
        <section className="relative w-full h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-black border-b border-gray-800 p-4 z-20">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">My Videos</h1>
              <button
                onClick={goHome}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 w-full h-full overflow-y-auto">
            {myVideosStep === "email" && (
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md px-4 space-y-4">
                  <h2 className="text-2xl font-bold text-white text-center">Find Your Videos</h2>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-gray-900 border-gray-800 text-white"
                  />
                  <Button
                    disabled={!email}
                    onClick={handleEmailSubmit}
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12"
                  >
                    Proceed
                  </Button>
                </div>
              </div>
            )}

            {myVideosStep === "verification" && (
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md px-4 space-y-4">
                  <h2 className="text-2xl font-bold text-white text-center">Verify Code</h2>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength="6"
                    className="h-12 bg-gray-900 border-gray-800 text-white text-center text-2xl tracking-widest"
                  />
                  <Button
                    disabled={code.length !== 6}
                    onClick={handleCodeSubmit}
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12"
                  >
                    Verify
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setMyVideosStep("email")}
                    className="w-full text-gray-400 hover:text-white h-12"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {myVideosStep === "videos" && (
              <div className="relative w-full h-screen flex items-center justify-center">
                <div className="relative w-full h-full md:w-[500px] md:h-full bg-black">
                  <img
                    src={currentVideo.thumbnail}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                  
                  <div className="absolute bottom-24 left-0 right-0 px-6 text-white z-10">
                    <p className="text-2xl font-bold mb-3">{currentVideo.title}</p>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700">
                        {currentVideo.duration}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700">
                        {currentVideo.quality}
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-0 right-0 px-6 z-20 flex gap-2">
                    <Button variant="outline" onClick={handlePrevVideo} className="flex-1 bg-transparent border-gray-700 text-white">← Prev</Button>
                    <Button variant="outline" onClick={handleNextVideo} className="flex-1 bg-transparent border-gray-700 text-white">Next →</Button>
                  </div>

                  <div className="absolute top-8 left-0 right-0 px-6 text-white text-center text-sm">
                    {currentVideoIndex + 1} of {SAMPLE_VIDEOS.length}
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <h2 className="text-3xl font-bold text-white mb-6">Terms of Service</h2>
            <div className="text-gray-300 space-y-4">
              <p><strong>By using this service, you agree to our terms and conditions.</strong></p>
              <p><strong>Payment Terms:</strong> All payments are one-time, non-refundable charges.</p>
              <p><strong>Content Rights:</strong> You own the videos generated using your photos.</p>
              <p><strong>User Responsibility:</strong> You confirm you have the right to use provided images.</p>
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
            <h2 className="text-3xl font-bold text-white mb-6">Privacy Policy</h2>
            <div className="text-gray-300 space-y-4">
              <p><strong>Data Collection:</strong> We collect emails to deliver videos and manage your account.</p>
              <p><strong>Image Security:</strong> Your photos are used only for video generation and deleted after processing.</p>
              <p><strong>No Tracking:</strong> We do not track your behavior or share data with third parties.</p>
              <p><strong>Payment Privacy:</strong> Payment processing is handled securely by Stripe.</p>
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
              <p><strong className="text-white">FashionAI</strong> is a cutting-edge platform that leverages artificial intelligence to transform fashion photography.</p>
              <p>We believe that everyone deserves access to professional-quality fashion content. Our mission is to make AI-generated fashion videos affordable, accessible, and easy to create.</p>
              <p><strong className="text-white">Our Technology:</strong> We use advanced AI models to analyze clothing and create realistic fashion videos.</p>
              <p><strong className="text-white">Why Choose Us?</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>No subscriptions or hidden fees</li>
                <li>Fast processing and instant delivery</li>
                <li>Multiple quality and duration options</li>
                <li>Privacy-focused platform</li>
                <li>Affordable pricing (under $1 per video)</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
