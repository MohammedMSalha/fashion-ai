import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import VideoSlider from "@/components/VideoSlider";
import { Sparkles } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white">
      {/* Video Slider Section */}
      <section className="relative">
        <VideoSlider />

        {/* Scroll Down Indicator and CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-16 md:pt-24 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Create Your Own AI Fashion Video
            </h2>

            {/* Clear Pricing Banner */}
            <div className="mb-6 md:mb-8 inline-block bg-gray-900 border border-gray-800 rounded-full px-4 md:px-6 py-2 md:py-3">
              <p className="text-gray-300 text-xs md:text-sm lg:text-base">
                <span className="text-white font-bold">$0.40-$0.90</span> per video • No subscription • No credits
              </p>
            </div>

            <p className="text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto text-base md:text-lg">
              Upload a photo of yourself and let AI create stunning fashion videos
            </p>
            <Button
              onClick={() => navigate("/generate")}
              className="bg-white text-black hover:bg-gray-100 font-bold text-base md:text-lg px-8 md:px-12 py-5 md:py-6 rounded-lg"
            >
              Start Generating
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-white">FashionAI</span>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/my-videos")}
            className="gap-2 bg-transparent border-white text-white hover:bg-white hover:text-black text-sm md:text-base"
          >
            My Videos
          </Button>
        </div>
      </nav>

    </div>
  );
}
