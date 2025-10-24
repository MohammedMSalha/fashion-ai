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
          <h1 className="text-xl md:text-2xl font-bold text-white">Generate Video</h1>
          <div className="w-12"></div>
        </div>
      </nav>

      {/* Form Section */}
      <section className="min-h-screen bg-black py-12 md:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
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

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="/" className="hover:text-white transition">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/generate" className="hover:text-white transition">
                    Generate
                  </a>
                </li>
                <li>
                  <a href="/my-videos" className="hover:text-white transition">
                    My Videos
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
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-12">
            <p className="text-sm text-gray-500">
              © 2024 FashionAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
