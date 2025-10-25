import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createApiUrl } from "@/config/api";

interface StripePaymentFormProps {
  amount: number;
  email: string;
  image: string;
  duration: "5s" | "10s";
  quality: "720p" | "1080p";
  onSuccess: () => void;
  onCancel: () => void;
}

const stripePublishableKey =
  (import.meta.env as any).VITE_STRIPE_PUBLISHABLE_KEY ||
  (import.meta.env as any).STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51SLjzIFKPN8vxl5YLX6M3Wg3e2zLBEIb8QaWGCgO1xfzI1aCxpIVxwhjCExKVtduI0Zln9uoEg4Hqy8i1iyMmWL5002Kw1N8Lz";

if (!stripePublishableKey) {
  console.error(
    "Stripe publishable key not found! Check VITE_STRIPE_PUBLISHABLE_KEY env var",
  );
}

const stripePromise = loadStripe(stripePublishableKey);

function CardForm({
  amount,
  email,
  image,
  duration,
  quality,
  onSuccess,
  onCancel,
  clientSecret,
}: StripePaymentFormProps & { clientSecret: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Auto-dismiss error after 6 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) {
      setError("Payment system not ready. Please try again.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log("Confirming payment with Stripe Payment Element...");

      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/`,
            receipt_email: email,
          },
          redirect: "if_required",
        });

      if (confirmError) {
        console.error("Stripe error:", confirmError);
        setError(confirmError.message || "Payment failed");
        toast({
          title: "Payment Error",
          description: confirmError.message,
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      console.log("Payment intent status:", paymentIntent?.status);

      if (!paymentIntent) {
        throw new Error("Payment intent not returned");
      }

      if (
        paymentIntent.status !== "succeeded" &&
        paymentIntent.status !== "processing"
      ) {
        throw new Error(
          `Payment status: ${paymentIntent.status}. Please try again.`,
        );
      }

      const paymentIntentId = paymentIntent.id;

      // Step 2: Generate video after successful payment
      let videoUrl = "";
      let requestId = "";

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const generateResponse = await fetch(
          createApiUrl("/api/generate-video"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image,
              duration: parseInt(duration),
              resolution: quality,
              email,
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);

        if (generateResponse.ok) {
          const generateData = await generateResponse.json();
          videoUrl = generateData.videoUrl || "";
          requestId = generateData.requestId || "";
          console.log("Video generation started:", { requestId, videoUrl });
        } else {
          console.warn(
            "Video generation response not ok:",
            generateResponse.status,
          );
        }
      } catch (err) {
        console.warn("Video generation error:", err);
      }

      // Step 3: Save video to database with payment data
      console.log("Saving video to database...", { requestId, videoUrl });
      if (requestId || videoUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          const saveResponse = await fetch(createApiUrl("/api/save-video"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              videoUrl: videoUrl || undefined,
              requestId: requestId || undefined,
              duration: parseInt(duration),
              resolution: quality,
              paymentIntentId: paymentIntentId,
              paymentAmount: amount,
              paymentCurrency: "usd",
              paymentStatus: paymentIntent.status,
              paymentMethodType:
                paymentIntent.payment_method_types?.[0] || "card",
              paymentEmail: email,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!saveResponse.ok) {
            console.warn("Save video response not ok:", saveResponse.status);
          } else {
            console.log("Video saved successfully");
          }
        } catch (err) {
          console.warn("Failed to save video to database", err);
        }
      }

      // Save email for later
      localStorage.setItem("fashionai_email", email);

      // Success!
      setProcessing(false);
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed";
      setError(errorMsg);
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-md mx-auto bg-gray-900 p-6 rounded-lg border border-gray-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Payment</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Loading State */}
      {!clientSecret && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-gray-400">Loading payment method...</span>
        </div>
      )}

      {/* Payment Element */}
      {clientSecret && <PaymentElement />}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
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

      {/* Amount Info */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 text-center border border-gray-700">
        <p className="text-gray-400 text-sm mb-1">Total amount</p>
        <p className="text-3xl font-bold text-white">${amount.toFixed(2)}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800 h-12"
          onClick={onCancel}
          disabled={processing || !stripe || !clientSecret}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={processing || !stripe || !elements || !clientSecret}
          className="flex-1 bg-white hover:bg-gray-100 text-black font-bold h-12"
        >
          {processing ? "Processing..." : "Pay & Generate"}
        </Button>
      </div>

      {/* Security Info */}
      <p className="text-xs text-gray-500 text-center">
        💳 Secure payment powered by Stripe
      </p>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Create payment intent on mount
  useEffect(() => {
    if (clientSecret) return;

    const createPaymentIntent = async () => {
      try {
        console.log("[Stripe] Creating payment intent...", {
          amount: Math.round(props.amount * 100),
          email: props.email,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const apiUrl = createApiUrl("/api/create-payment-intent");
        console.log("[Stripe] Calling:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(props.amount * 100),
            email: props.email,
            imageUrl: props.image,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("[Stripe] Response status:", response.status);

        if (!response.ok) {
          let errorMsg = "Failed to create payment intent";
          try {
            const errorData = await response.json();
            console.log("[Stripe] Error response:", errorData);
            errorMsg = errorData.error || errorMsg;
          } catch {
            const text = await response.text();
            console.log("[Stripe] Response text:", text);
            errorMsg = `Server error (${response.status})`;
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("[Stripe] Payment intent response:", data);

        if (!data.clientSecret) {
          throw new Error(
            `No client secret in response. Got: ${JSON.stringify(data)}`,
          );
        }

        console.log("[Stripe] Setting clientSecret");
        setClientSecret(data.clientSecret);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to initialize payment";
        console.error("[Stripe] Error:", errorMsg, err);
        setLoadingError(errorMsg);
      }
    };

    createPaymentIntent();
  }, [props.amount, props.email, props.image]);

  if (loadingError) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-900 p-6 rounded-lg border border-gray-800">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-200">Payment Error</p>
            <p className="text-sm text-red-300">{loadingError}</p>
          </div>
        </div>
        <Button
          onClick={props.onCancel}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  // Only render Elements when we have a clientSecret
  if (!clientSecret) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-900 p-6 rounded-lg border border-gray-800">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-gray-400">Loading payment method...</span>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#ffffff",
            colorBackground: "#1f2937",
            colorText: "#ffffff",
            borderRadius: "0.5rem",
          },
        },
      }}
    >
      <CardForm {...props} clientSecret={clientSecret} />
    </Elements>
  );
}
