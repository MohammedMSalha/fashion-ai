import { useState } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoSlider from "@/components/VideoSlider";
import VideoGeneratorForm from "@/components/VideoGeneratorForm";
import { Sparkles, X, Mail, FileText, Lock, Play } from "lucide-react";

type Modal = null | "generate" | "my-videos" | "contact" | "terms" | "privacy";
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
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [myVideosStep, setMyVideosStep] = useState<MyVideosStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const handleEmailSubmit = () => {
    if (email) setMyVideosStep("verification");
  };

  const handleCodeSubmit = () => {
    if (code) setMyVideosStep("videos");
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) =>
      prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1
    );
  };

  const closeModal = () => {
    setActiveModal(null);
    if (activeModal === "my-videos") {
      setMyVideosStep("email");
      setEmail("");
      setCode("");
    }
  };

  const currentVideo = SAMPLE_VIDEOS[currentVideoIndex];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Main Video Slider */}
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
                <span className="text-white font-bold">$0.40-$0.90</span> per video • No subscription • No credits
              </p>
            </div>

            <p className="text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto text-base md:text-lg">
              Upload a photo of yourself and let AI create stunning fashion videos
            </p>
            <Button
              onClick={() => setActiveModal("generate")}
              className="bg-white text-black hover:bg-gray-100 font-bold text-base md:text-lg px-8 md:px-12 py-5 md:py-6 rounded-lg"
            >
              Start Generating
            </Button>
          </div>
        </div>
      </section>

      {/* Floating Action Button Menu */}
      <div className="fixed bottom-8 right-8 z-40">
        <div
          className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${
            showFabMenu ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <button
            onClick={() => {
              setActiveModal("contact");
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
          >
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">Contact</span>
          </button>

          <button
            onClick={() => {
              setActiveModal("terms");
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium">Terms</span>
          </button>

          <button
            onClick={() => {
              setActiveModal("privacy");
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full transition-all"
          >
            <Lock className="w-5 h-5" />
            <span className="text-sm font-medium">Privacy</span>
          </button>

          <button
            onClick={() => {
              setActiveModal("my-videos");
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 bg-white hover:bg-gray-100 text-black px-4 py-3 rounded-full transition-all font-semibold"
          >
            <Play className="w-5 h-5" />
            <span className="text-sm">My Videos</span>
          </button>
        </div>

        {/* Main FAB Toggle */}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center shadow-lg transition-all hover:scale-110"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Backdrop */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/70 z-40 transition-opacity"
          onClick={closeModal}
        />
      )}

      {/* Generate Modal */}
      {activeModal === "generate" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <div className="sticky top-0 bg-black border-b border-gray-800 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">Generate Video</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-center text-gray-300">
                  <span className="text-white font-semibold">No subscription. No credits.</span> Just pay once per video. That's it.
                </p>
              </div>
              <VideoGeneratorForm />
            </div>
          </div>
        </div>
      )}

      {/* My Videos Modal - TikTok Style */}
      {activeModal === "my-videos" && myVideosStep !== "videos" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            {/* Close Button */}
            <div className="border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Videos</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Email Step */}
            {myVideosStep === "email" && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm bg-gray-900 border-gray-800 text-white"
                  />
                </div>
                <Button
                  disabled={!email}
                  onClick={handleEmailSubmit}
                  className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-10 text-sm"
                >
                  Proceed
                </Button>
              </div>
            )}

            {/* Code Step */}
            {myVideosStep === "verification" && (
              <div className="p-6 space-y-4">
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
                    className="h-10 text-sm bg-gray-900 border-gray-800 text-white text-center text-lg tracking-widest"
                  />
                </div>
                <Button
                  disabled={code.length !== 6}
                  onClick={handleCodeSubmit}
                  className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-10 text-sm"
                >
                  Verify
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMyVideosStep("email");
                    setCode("");
                  }}
                  className="w-full text-gray-400 hover:text-white h-10 text-sm"
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Videos - Full Screen TikTok Style */}
      {activeModal === "my-videos" && myVideosStep === "videos" && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-20 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Video Container */}
          <div className="relative w-full h-full md:w-[500px] md:h-full bg-black flex items-center justify-center">
            {/* Current Video */}
            <div className="relative w-full h-full">
              <img
                src={currentVideo.thumbnail}
                alt={currentVideo.title}
                className="w-full h-full object-cover"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

              {/* Video Info */}
              <div className="absolute bottom-24 left-0 right-0 px-6 text-white z-10">
                <p className="text-2xl font-bold mb-3">{currentVideo.title}</p>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                    {currentVideo.duration}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                    {currentVideo.quality}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
                <Button
                  className="w-full bg-white hover:bg-gray-100 text-black font-semibold h-12"
                  onClick={() => window.open(currentVideo.downloadUrl)}
                >
                  Download Video
                </Button>
              </div>

              {/* Pagination */}
              <div className="absolute top-8 left-0 right-0 px-6 z-20">
                <p className="text-white text-center text-sm">
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
            </div>
          </div>

          {/* Navigation Hints */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs z-20">
            Scroll up/down to browse
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {activeModal === "contact" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Contact Us</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-gray-300">Get in touch with us</p>
              <a
                href="mailto:support@fashionai.com"
                className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {activeModal === "terms" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="sticky top-0 bg-black border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Terms of Service</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-300 space-y-3 max-h-[60vh] overflow-y-auto">
              <p>By using this service, you agree to our terms and conditions.</p>
              <p>
                <strong>Payment Terms:</strong> All payments are one-time, non-refundable charges.
              </p>
              <p>
                <strong>Content Rights:</strong> You own the videos generated using your photos.
              </p>
              <p>
                <strong>User Responsibility:</strong> You confirm you have the right to use provided images.
              </p>
              <p>© 2024 FashionAI. All rights reserved.</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {activeModal === "privacy" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="sticky top-0 bg-black border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-300 space-y-3 max-h-[60vh] overflow-y-auto">
              <p>
                <strong>Data Collection:</strong> We collect emails to deliver videos and manage your account.
              </p>
              <p>
                <strong>Image Security:</strong> Your photos are used only for video generation and deleted after processing.
              </p>
              <p>
                <strong>No Tracking:</strong> We do not track your behavior or share data with third parties.
              </p>
              <p>
                <strong>Payment Privacy:</strong> Payment processing is handled securely by Stripe.
              </p>
              <p>
                <strong>Contact:</strong> For privacy concerns, email us at support@fashionai.com
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
