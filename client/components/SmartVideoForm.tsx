import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CheckoutButton from "./CheckoutButton";

interface SmartVideoFormProps {
  onGenerate?: () => void;
  onPaymentSuccess?: () => void;
}

const PRICING = {
  "5s": { "720p": 0.5, "1080p": 0.65 },
  "10s": { "720p": 0.75, "1080p": 0.9 },
};

export default function SmartVideoForm({ onGenerate }: SmartVideoFormProps) {
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageResolution, setImageResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState<"5s" | "10s">("10s");
  const [quality, setQuality] = useState<"720p" | "1080p">("1080p");
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "payment">("upload");

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("fashionai_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Payment callbacks - must be defined before any conditional returns
  const handlePaymentSuccess = useCallback(() => {
    console.log("Payment successful! Navigating...");
    localStorage.setItem("fashionai_email", email);
    setStep("upload");
    onGenerate?.();
  }, [email, onGenerate]);

  const handlePaymentCancel = useCallback(() => {
    setStep("review");
  }, []);

  const detectImageResolution = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setImageResolution({ width, height });

        // Auto-detect quality based on image resolution
        if (width >= 2560 || height >= 2560) {
          setQuality("1080p");
        } else if (width >= 1280 || height >= 1280) {
          setQuality("1080p");
        } else {
          setQuality("720p");
        }

        // Auto-select 10s for higher quality images
        if (width >= 1920 || height >= 1920) {
          setDuration("10s");
        } else {
          setDuration("5s");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (file: File) => {
    if (file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setImagePreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
      detectImageResolution(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateClick = () => {
    if (email && imagePreview) {
      localStorage.setItem("fashionai_email", email);
      onGenerate?.();
    }
  };

  const calculatePrice = () => {
    return PRICING[duration][quality];
  };

  const getResolutionText = () => {
    if (!imageResolution) return "";
    const megapixels = (
      (imageResolution.width * imageResolution.height) /
      1000000
    ).toFixed(1);
    return `${imageResolution.width}×${imageResolution.height} (${megapixels}MP)`;
  };

  // UPLOAD STEP
  if (step === "upload") {
    return (
      <div className="w-full space-y-6">
        {/* Image Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
            dragActive
              ? "border-white bg-gray-800"
              : "border-gray-700 hover:border-gray-600",
          )}
        >
          {!imagePreview ? (
            <div>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-white font-semibold mb-1">
                Drag your photo here
              </p>
              <p className="text-sm text-gray-400 mb-4">or click to browse</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 cursor-pointer"
                >
                  Browse Files
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-3">Max 10MB • JPG, PNG</p>
            </div>
          ) : (
            <div>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-48 object-contain mx-auto mb-4 rounded"
              />
              <p className="text-green-400 text-sm font-semibold mb-2">
                ✓ Image ready for generation
              </p>
              {imageResolution && (
                <p className="text-xs text-gray-400 mb-4">
                  {getResolutionText()}
                </p>
              )}
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white text-sm"
                onClick={() => {
                  setImagePreview("");
                  setImageResolution(null);
                }}
              >
                Change image
              </Button>
            </div>
          )}
        </div>

        {/* Settings Grid */}
        {imagePreview && (
          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-gray-800 border-gray-700 text-white text-sm"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
              <div className="space-y-2">
                {(["5s", "10s"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "w-full p-2 rounded-lg text-sm font-medium transition-all text-center",
                      duration === d
                        ? "bg-white text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700",
                    )}
                  >
                    {d === "5s" ? "5s" : "10s"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quality
              </label>
              <div className="space-y-2">
                {(["720p", "1080p"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={cn(
                      "w-full p-2 rounded-lg text-sm font-medium transition-all text-center",
                      quality === q
                        ? "bg-white text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700",
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-detected Info */}
        {imagePreview && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-400" />
              Settings auto-adjusted based on your image
            </p>
          </div>
        )}

        {/* Price & Generate Button */}
        {imagePreview && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-gray-400 text-sm">Total price</p>
              <p className="text-2xl font-bold text-white">
                ${calculatePrice()?.toFixed(2)}
              </p>
            </div>

            <Button
              disabled={!email || !imagePreview}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold h-12"
              onClick={() => setStep("review")}
            >
              Review & Generate
            </Button>
          </div>
        )}
      </div>
    );
  }

  // REVIEW STEP
  if (step === "review") {
    return (
      <div className="w-full space-y-6">
        {/* Image Preview */}
        <div
          className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center"
          style={{ minHeight: "400px" }}
        >
          <img
            src={imagePreview}
            alt="Final"
            className="max-w-full max-h-96 object-contain"
          />
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Email</span>
            <span className="text-sm font-medium text-white">{email}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Duration</span>
            <span className="text-sm font-medium text-white">
              {duration === "5s" ? "5 seconds" : "10 seconds"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-400">Quality</span>
            <span className="text-sm font-medium text-white">
              {quality === "720p" ? "720p (HD)" : "1080p (Full HD)"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700">
            <span className="text-sm text-gray-400">Total</span>
            <span className="text-xl font-bold text-white">
              ${calculatePrice()?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 48-hour notice */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-white font-semibold mb-1">
            ⏱️ Video expires in 48 hours
          </p>
          <p className="text-xs text-gray-300">
            Download now to save permanently
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800 h-12"
            onClick={() => setStep("upload")}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800 h-12 font-bold flex items-center justify-center gap-2"
            onClick={() => setStep("payment")}
          >
            <Check className="w-4 h-4" />
            Pay & Generate
          </Button>
        </div>
      </div>
    );
  }

  // PAYMENT STEP
  if (step === "payment") {
    const price = calculatePrice();

    if (!price || !email || !imagePreview) {
      return (
        <div className="w-full space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">
              Error: Missing payment information. Please go back and try again.
            </p>
          </div>
          <button
            onClick={() => setStep("review")}
            className="text-white underline hover:opacity-80"
          >
            Go back
          </button>
        </div>
      );
    }

    return (
      <div className="w-full space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>

        <CheckoutButton
          amount={price}
          email={email}
          duration={duration}
          quality={quality}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return null;
}
