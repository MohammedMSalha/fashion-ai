import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Mail, Clock, Video, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type FormStep = "upload" | "email" | "duration" | "quality" | "review";

interface FormData {
  image: File | null;
  email: string;
  duration: "5s" | "10s" | null;
  quality: "720p" | "1080p" | null;
}

const PRICING = {
  "5s": { "720p": 0.5, "1080p": 0.65 },
  "10s": { "720p": 0.75, "1080p": 0.9 },
};

interface VideoGeneratorFormProps {
  onGenerate?: () => void;
}

export default function VideoGeneratorForm({
  onGenerate,
}: VideoGeneratorFormProps) {
  const [step, setStep] = useState<FormStep>("upload");
  const [formData, setFormData] = useState<FormData>({
    image: null,
    email: "",
    duration: null,
    quality: null,
  });
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageSelect = (file: File) => {
    if (file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const calculatePrice = () => {
    if (formData.duration && formData.quality) {
      return PRICING[formData.duration][formData.quality];
    }
    return null;
  };

  const steps: { id: FormStep; label: string; icon: JSX.Element }[] = [
    { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "duration", label: "Duration", icon: <Clock className="w-4 h-4" /> },
    { id: "quality", label: "Quality", icon: <Video className="w-4 h-4" /> },
    { id: "review", label: "Review", icon: <Check className="w-4 h-4" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (s.id === "upload" && formData.image) {
                    setStep(s.id);
                  } else if (
                    s.id === "email" &&
                    formData.image &&
                    formData.email
                  ) {
                    setStep(s.id);
                  } else if (
                    s.id === "duration" &&
                    formData.duration === null
                  ) {
                    return;
                  } else if (s.id === "quality" && formData.quality === null) {
                    return;
                  }
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                  step === s.id || stepIndex > idx
                    ? "bg-white text-black"
                    : "bg-gray-700 text-gray-300",
                )}
              >
                {stepIndex > idx ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{idx + 1}</span>
                )}
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded transition-colors",
                    stepIndex > idx ? "bg-white" : "bg-gray-700",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-medium text-gray-400">
          {steps.map((s) => (
            <span key={s.id}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 lg:p-12 border border-gray-800">
        {/* Upload Step */}
        {step === "upload" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Upload Your Photo
            </h2>
            <p className="text-gray-400 mb-6">
              Choose a high-quality photo of a person wearing clothes
            </p>

            {!imagePreview ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                  dragActive
                    ? "border-white bg-gray-800"
                    : "border-gray-700 hover:border-gray-600",
                )}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-white font-semibold mb-1">
                  Drag and drop your image
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  or click to browse (JPG, PNG max 10MB)
                </p>
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
                <label
                  htmlFor="image-input"
                  className="inline-block cursor-pointer"
                >
                  <Button variant="outline">Browse Files</Button>
                </label>
              </div>
            ) : (
              <div className="mb-6">
                <div className="relative w-full h-80 bg-slate-100 rounded-xl overflow-hidden mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setImagePreview("");
                    setFormData({ ...formData, image: null });
                  }}
                >
                  Choose Different Image
                </Button>
              </div>
            )}

            <Button
              disabled={!formData.image}
              className="w-full mt-6 bg-white hover:bg-gray-100 text-black font-semibold"
              onClick={() => setStep("email")}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Email Step */}
        {step === "email" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Your Email Address
            </h2>
            <p className="text-gray-400 mb-6">
              We'll send your video link and store your videos
            </p>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-12 text-base bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">
                ✓ Your email is used only to send download links and identify
                your videos
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setStep("upload")}
              >
                Back
              </Button>
              <Button
                disabled={!formData.email}
                className="flex-1 bg-white hover:bg-gray-100 text-black font-semibold"
                onClick={() => setStep("duration")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Duration Step */}
        {step === "duration" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Video Duration
            </h2>
            <p className="text-gray-400 mb-6">
              Choose how long your fashion video should be
            </p>

            <div className="space-y-3 mb-6">
              {(["5s", "10s"] as const).map((dur) => (
                <button
                  key={dur}
                  onClick={() => setFormData({ ...formData, duration: dur })}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 transition-all text-left font-medium",
                    formData.duration === dur
                      ? "border-white bg-gray-800 text-white"
                      : "border-gray-700 hover:border-gray-600 text-gray-300",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{dur === "5s" ? "5 Seconds" : "10 Seconds"}</span>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center">
                      {formData.duration === dur && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setStep("email")}
              >
                Back
              </Button>
              <Button
                disabled={!formData.duration}
                className="flex-1 bg-white hover:bg-gray-100 text-black font-semibold"
                onClick={() => setStep("quality")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Quality Step */}
        {step === "quality" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Video Quality
            </h2>
            <p className="text-gray-400 mb-6">
              Higher quality means larger file size and slightly higher price
            </p>

            <div className="space-y-3 mb-6">
              {(["720p", "1080p"] as const).map((qual) => (
                <button
                  key={qual}
                  onClick={() => setFormData({ ...formData, quality: qual })}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 transition-all text-left font-medium",
                    formData.quality === qual
                      ? "border-white bg-gray-800 text-white"
                      : "border-gray-700 hover:border-gray-600 text-gray-300",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {qual === "720p" ? "720p (HD)" : "1080p (Full HD)"}
                    </span>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center">
                      {formData.quality === qual && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setStep("duration")}
              >
                Back
              </Button>
              <Button
                disabled={!formData.quality}
                className="flex-1 bg-white hover:bg-gray-100 text-black font-semibold"
                onClick={() => setStep("review")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Ready to Create?
            </h2>

            <div className="space-y-4 mb-8">
              {/* Image Preview */}
              <div className="rounded-lg overflow-hidden bg-gray-800">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Your upload"
                    className="w-full h-48 object-cover"
                  />
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Email</span>
                  <span className="font-medium text-white">
                    {formData.email}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-medium text-white">
                      {formData.duration === "5s" ? "5 seconds" : "10 seconds"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quality</span>
                  <span className="font-medium text-white">
                    {formData.quality === "720p"
                      ? "720p (HD)"
                      : "1080p (Full HD)"}
                  </span>
                </div>
              </div>

              {/* Pricing - Prominent */}
              <div className="bg-white rounded-lg p-6 border-2 border-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-black font-semibold">Total Price</span>
                  <span className="text-4xl font-bold text-black">
                    ${calculatePrice()?.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-black font-medium">
                    ✓ No subscription
                  </p>
                  <p className="text-sm text-black font-medium">
                    ✓ No credits needed
                  </p>
                  <p className="text-sm text-black font-medium">
                    ✓ One-time payment only
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setStep("quality")}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-white hover:bg-gray-100 text-black font-bold text-lg py-6"
                onClick={onGenerate}
              >
                Pay ${calculatePrice()?.toFixed(2)} & Generate
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment via Stripe. You'll get your video link via email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
