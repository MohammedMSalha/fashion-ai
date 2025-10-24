import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import VideoGeneratorForm from "@/components/VideoGeneratorForm";
import VideoSlider from "@/components/VideoSlider";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export default function Index() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-black text-white">
      {/* Video Slider Section */}
      <section className="relative">
        <VideoSlider />

        {/* Scroll Down Indicator and CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Create Your Own AI Fashion Video
            </h2>

            {/* Clear Pricing Banner */}
            <div className="mb-6 inline-block bg-gray-900 border border-gray-800 rounded-full px-4 py-2">
              <p className="text-gray-300 text-sm">
                <span className="text-white font-bold">$0.40-$0.90</span> per video • No subscription • No credits
              </p>
            </div>

            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Upload a photo of yourself and let AI create stunning fashion videos
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-black hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-lg"
            >
              Start Generating
            </Button>
          </div>
        </div>
      </section>

      {/* Form Section */}
      {showForm && (
        <section className="min-h-screen bg-black py-12 md:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
            <button
              onClick={() => setShowForm(false)}
              className="mb-8 text-gray-400 hover:text-white transition flex items-center gap-2 text-lg"
            >
              ← Back to Videos
            </button>

            {/* Clear Messaging */}
            <div className="mb-10 p-6 bg-gray-900 border border-gray-800 rounded-lg">
              <p className="text-center text-gray-300 text-lg">
                <span className="text-white font-semibold">No subscription. No credits.</span> Just pay once per video. That's it.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-full lg:w-2/3">
                <VideoGeneratorForm />
              </div>
            </div>
          </div>
        </section>
      )}

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

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-white">FashionAI</span>
              </div>
              <p className="text-sm text-gray-400">
                Transform photos into stunning AI fashion videos
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Create Video
                  </a>
                </li>
                <li>
                  <a href="/my-videos" className="hover:text-white transition">
                    My Videos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Support Center
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-500">
              © 2024 FashionAI. All rights reserved.
            </p>
            <div className="flex gap-6 md:gap-8">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition text-sm">
                Twitter
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition text-sm">
                Instagram
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition text-sm">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
