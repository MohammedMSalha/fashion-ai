import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import VideoGeneratorForm from "@/components/VideoGeneratorForm";

export default function Generate() {
  const navigate = useNavigate();

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
            ← Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Generate Video
          </h1>
          <div className="w-12"></div>
        </div>
      </nav>

      {/* Form Section */}
      <section className="min-h-screen bg-black py-12 md:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
          {/* Clear Messaging */}
          <div className="mb-10 p-6 bg-gray-900 border border-gray-800 rounded-lg">
            <p className="text-center text-gray-300 text-lg">
              <span className="text-white font-semibold">
                No subscription. No credits.
              </span>{" "}
              Just pay once per video. That's it.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full lg:w-2/3">
              <VideoGeneratorForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
