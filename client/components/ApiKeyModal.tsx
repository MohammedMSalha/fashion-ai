import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createApiUrl } from "@/config/api";
import { AlertCircle, Zap } from "lucide-react";

interface ApiKeyModalProps {
  open: boolean;
  onApiKeySubmit: (apiKey: string | null) => void;
}

export default function ApiKeyModal({
  open,
  onApiKeySubmit,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch demo configuration on component mount
  useEffect(() => {
    const fetchDemoConfig = async () => {
      try {
        const response = await fetch(createApiUrl("/api/demo"));
        if (response.ok) {
          const data = await response.json();
          setDemoMode(data.demoMode);
        }
      } catch (error) {
        console.error("[ApiKeyModal] Failed to fetch demo config:", error);
        setDemoMode(false);
      }
    };

    fetchDemoConfig();
  }, []);

  // If not demo mode or config not loaded yet, don't show the modal
  if (demoMode === false || demoMode === null) {
    return null;
  }

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      onApiKeySubmit(apiKey);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onApiKeySubmit(null);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-purple-500/30 shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
              API Key Required
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Description Text */}
          <p className="text-gray-300 text-sm">
            To generate your video, you need to provide your Fashion.ai API key.
          </p>

          {/* Enhanced Alert Box */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-300 mb-1">
                  {demoMode === true
                    ? "Demo Mode - Required"
                    : "Demo Mode Only"}
                </p>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  {demoMode === true
                    ? "Your Fashion.ai API key is required to generate videos in demo mode."
                    : "This step is only required for demo use. In production, this won't be needed."}
                </p>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Enter Your API Key{" "}
              {demoMode === true && <span className="text-red-400">*</span>}
            </label>
            <Input
              type="password"
              placeholder="fa-XXXXXXXXXXXXXXXXXXXXXXXX"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-11 bg-gray-800 border-purple-500/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-500/50 text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-2">
              Don't have a key?{" "}
              <a
                href="https://fashn.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 font-semibold underline transition"
              >
                Get one from fashn.ai
              </a>
            </p>
          </div>
        </div>

        {/* Button Container */}
        <div
          className={`flex gap-3 mt-6 pt-4 border-t border-gray-700 ${demoMode === true ? "flex-col" : ""}`}
        >
          {demoMode !== true && (
            <Button
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white font-semibold transition"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          )}
          <Button
            className={`${demoMode === true ? "w-full" : "flex-1"} bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50`}
            onClick={handleSubmit}
            disabled={!apiKey.trim() || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validating...
              </span>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
