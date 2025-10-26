import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface Video {
  id: string;
  thumbnail: string;
  title: string;
}

const SAMPLE_VIDEOS: Video[] = [
  {
    id: "1",
    thumbnail:
      "https://v3b.fal.media/files/b/monkey/Tq_jLJRXgc3pSvDD9_QZG_output.mp4",
    title: "Playful Monkey",
  },
  {
    id: "2",
    thumbnail:
      "https://v3b.fal.media/files/b/tiger/BL9b7CdNcL7jQBxr7SizO_output.mp4",
    title: "Majestic Tiger",
  },
  {
    id: "3",
    thumbnail:
      "https://v3b.fal.media/files/b/zebra/oLCzAuqNNVnXpYAdAgG13_output.mp4",
    title: "Striped Zebra",
  },
  {
    id: "4",
    thumbnail:
      "https://v3b.fal.media/files/b/monkey/fWLLLHfUNEF0E4y2gy08g_output.mp4",
    title: "Wild Monkey Moves",
  },
  {
    id: "5",
    thumbnail:
      "https://v3b.fal.media/files/b/elephant/CTgfFs2p1d1t58f8FFPKp_output.mp4",
    title: "Gentle Elephant",
  },
];

export default function VideoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showScroll, setShowScroll] = useState(true);
  const touchStartY = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScroll(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Auto-advance to next video every 6 seconds
  useEffect(() => {
    const autoAdvanceTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
    }, 6000);
    return () => clearInterval(autoAdvanceTimer);
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
          prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1,
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
        prev === 0 ? SAMPLE_VIDEOS.length - 1 : prev - 1,
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
          <video
            ref={videoRef}
            src={currentVideo.thumbnail}
            muted
            loop
            playsInline
            autoPlay
            className="w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-3 sm:p-4 rounded-full transition-all z-20 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            )}
          </button>

          {/* Progress Indicator */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent px-4 sm:px-6 py-3 sm:py-4 flex gap-1 z-10">
            {SAMPLE_VIDEOS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 sm:h-2 flex-1 rounded-full transition-all backdrop-blur-sm ${
                  idx === currentIndex
                    ? "bg-white shadow-lg"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
