import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import VideoGeneratorForm from "@/components/VideoGeneratorForm";
import { Sparkles, Zap, Shield, Clock } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white bg-opacity-95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FashionAI
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/my-videos")}
            className="gap-2"
          >
            My Videos
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
            Turn Your Photo Into an
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Fashion Video
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Upload a photo, pick your style preferences, and watch as AI creates
            a stunning fashion video. All in minutes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Sparkles,
              label: "AI-Powered",
              desc: "Advanced AI creates realistic videos",
            },
            {
              icon: Zap,
              label: "Lightning Fast",
              desc: "Results in minutes, not hours",
            },
            {
              icon: Shield,
              label: "Secure & Private",
              desc: "Your data stays confidential",
            },
            {
              icon: Clock,
              label: "Flexible Duration",
              desc: "Choose 5s or 10s videos",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <Icon className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">
                  {feature.label}
                </h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Form Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <VideoGeneratorForm />
      </section>

      {/* Social Proof / Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600">
            Choose your duration and quality. All prices under $1.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { duration: "5 Seconds", quality720: "$0.40", quality1080: "$0.60" },
            {
              duration: "10 Seconds",
              quality720: "$0.70",
              quality1080: "$0.90",
            },
          ].map((tier, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                {tier.duration}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600">720p (HD)</span>
                  <span className="font-bold text-lg text-slate-900">
                    {tier.quality720}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">1080p (Full HD)</span>
                  <span className="font-bold text-lg text-slate-900">
                    {tier.quality1080}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900">FashionAI</span>
              </div>
              <p className="text-sm text-slate-600">
                Transform photos into stunning AI fashion videos
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="/" className="hover:text-slate-900">
                    Create Video
                  </a>
                </li>
                <li>
                  <a
                    href="/my-videos"
                    className="hover:text-slate-900"
                  >
                    My Videos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Support Center
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-slate-600">
              © 2024 FashionAI. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-slate-600">
                Twitter
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600">
                Instagram
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
