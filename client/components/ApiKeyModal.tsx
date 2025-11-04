import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createApiUrl } from "@/config/api";

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
      // Test the API key by calling the demo endpoint
      // In a real scenario, you might want to validate the key
      onApiKeySubmit(apiKey);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // If user doesn't provide a key, use null (system key will be used)
    onApiKeySubmit(null);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Fashion.ai API Key</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              To generate your video, you need to provide your Fashion.ai API
              key.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                💡 <strong>Demo Mode:</strong> This step is only required for
                demo use. In production, this won't be needed.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <Input
                type="password"
                placeholder="fa-XXXXXXXXXXXXXXXXXXXXXXXX"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-10 bg-gray-800 border-gray-700 text-white text-sm"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-2">
                Get your API key from{" "}
                <a
                  href="https://fashn.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  fashn.ai
                </a>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="flex-1 bg-white hover:bg-gray-100 text-black font-bold"
              onClick={handleSubmit}
              disabled={!apiKey.trim() || isLoading}
            >
              {isLoading ? "Validating..." : "Continue"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
