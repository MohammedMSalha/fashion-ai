import { useState, useRef, useEffect } from "react";
import { ChevronDown, Play, Pause } from "lucide-react";

interface Video {
  id: string;
  thumbnail: string;
  title: string;
}

const SAMPLE_VIDEOS: Video[] = [
  {
    id: "1",
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=900&fit=crop",
    title: "Summer Collection",
  },
  {
    id: "2",
    thumbnail:
      "https://images.unsplash.com/photo-1539571696357-5a69c006b15d?w=500&h=900&fit=crop",
    title: "Urban Style",
  },
  {
    id: "3",
    thumbnail:
      "https://images.unsplash.com/photo-1595777707802-41d339d60b84?w=500&h=900&fit=crop",
    title: "Evening Wear",
  },
  {
    id: "4",
    thumbnail:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=900&fit=crop",
    title: "Casual Vibes",
  },
  {
    id: "5",
    thumbnail:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=900&fit=crop",
    title: "Fashion Forward",
  },
];

export default function VideoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showScroll, setShowScroll] = useState(true);
  const touchStartY = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScroll(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped up
        setCurrentIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
      } else {
        // Swiped down
        setCurrentIndex((prev) =>
          prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1
        );
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setCurrentIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
    } else {
      setCurrentIndex((prev) =>
        prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1
      );
    }
  };

  const currentVideo = SAMPLE_VIDEOS[currentIndex];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video Container */}
      <div
        className="relative w-full h-full bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Current Video */}
        <div className="relative w-full h-full">
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="w-full h-full object-cover"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />


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

          {/* Progress Indicator */}
          <div className="absolute top-6 left-0 right-0 px-6 flex gap-1 z-10">
            {SAMPLE_VIDEOS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx === currentIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Side Info (Desktop) */}
      <div className="hidden lg:flex absolute right-6 top-1/2 transform -translate-y-1/2 flex-col gap-8 z-20">
        {/* Contact Button */}
        <a href="#" className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition">
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

        {/* Terms Button */}
        <a href="#" className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition">
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

        {/* Privacy Button */}
        <a href="#" className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition">
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
  );
}
