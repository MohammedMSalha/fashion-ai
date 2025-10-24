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

          {/* Video Title */}
          <div className="absolute bottom-24 left-0 right-0 px-6 text-white z-10">
            <p className="text-2xl font-bold">{currentVideo.title}</p>
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
        {/* Like Button */}
        <button className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition">
          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center hover:bg-white/10">
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-xs">12K</span>
        </button>

        {/* Comment Button */}
        <button className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="text-xs">2.3K</span>
        </button>

        {/* Share Button */}
        <button className="flex flex-col items-center gap-2 text-white hover:text-gray-400 transition">
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <span className="text-xs">Share</span>
        </button>
      </div>
    </div>
  );
}
