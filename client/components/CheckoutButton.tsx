import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckoutButtonProps {
  amount: number;
  email: string;
  duration: "5s" | "10s";
  quality: "720p" | "1080p";
  onCancel: () => void;
}

export default function CheckoutButton({
  amount,
  email,
  duration,
  quality,
  onCancel,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!amount || !email) {
      setError("Missing payment information");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Creating checkout session...", { amount, email, duration, quality });

      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          email,
          duration,
          quality,
          baseUrl: window.location.origin,
        }),
      });

      console.log("Checkout response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || `HTTP ${response.status}`;
        console.error("Checkout error:", errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("Checkout session created:", data);

      if (data.checkoutUrl) {
        console.log("Redirecting to:", data.checkoutUrl);
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned from server");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to start checkout";
      setError(errorMsg);
      toast({
        title: "Checkout Error",
        description: errorMsg,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-center border border-gray-700">
        <p className="text-gray-400 text-sm mb-1">Total amount</p>
        <p className="text-3xl font-bold text-white">${amount.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-2">
          Secure payment powered by Stripe
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800 h-12"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="flex-1 bg-white hover:bg-gray-100 text-black font-bold h-12"
        >
          {loading ? "Opening Stripe..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        You will be redirected to Stripe's secure checkout page. After payment,
        you'll return here to generate your video.
      </p>
    </div>
  );
}
