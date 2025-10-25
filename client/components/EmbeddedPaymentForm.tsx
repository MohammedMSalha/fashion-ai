import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { createApiUrl } from "@/config/api";

interface EmbeddedPaymentFormProps {
  amount: number;
  email: string;
  duration: "5s" | "10s";
  quality: "720p" | "1080p";
  onSuccess: () => void;
  onCancel: () => void;
}

// Stripe will be loaded via script tag, no need to declare

export default function EmbeddedPaymentForm({
  amount,
  email,
  duration,
  quality,
  onSuccess,
  onCancel,
}: EmbeddedPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayment = async () => {
    const stripe = (window as any).Stripe;
    if (!stripe) {
      setError("Stripe not loaded");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Creating payment intent...", { amount, email });

      // Step 1: Create payment intent on backend
      const response = await fetch(createApiUrl("/api/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          email,
          duration,
          quality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const { clientSecret } = await response.json();
      console.log("✓ Payment intent created");

      // Step 2: Confirm payment with Stripe
      const stripeInstance = stripe(
        process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
      );
      const elements = stripe.elements({ clientSecret });
      const paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/generate?payment=success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
        setLoading(false);
        return;
      }

      console.log("✓ Payment successful");
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed";
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400 text-sm mb-1">Total Amount</p>
        <p className="text-3xl font-bold text-white">${amount.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-2">
          Duration: {duration} | Quality: {quality}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-white">
          Card Details
        </label>
        <div
          id="payment-element"
          className="bg-gray-900 border border-gray-700 rounded-lg p-4"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
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
          onClick={handlePayment}
          disabled={loading || !cardComplete}
          className="flex-1 bg-white hover:bg-gray-100 text-black font-bold h-12"
        >
          {loading ? "Processing..." : "Generate"}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secure and processed by Stripe
      </p>
    </div>
  );
}
