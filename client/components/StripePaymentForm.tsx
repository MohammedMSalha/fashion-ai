import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  ElementsConsumer,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51SLjzIFKPN8vxl5YLX6M3Wg3e2zLBEIb8QaWGCgO1xfzI1aCxpIVxwhjCExKVtduI0Zln9uoEg4Hqy8i1iyMmWL5002Kw1N8Lz";

const stripePromise = loadStripe(stripePublishableKey);

const CardForm = ({
  amount,
  email,
  image,
  duration,
  quality,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const { toast } = useToast();
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-dismiss error after 6 seconds
  useEffect(() => {
    if (error || cardError) {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
      const timeout = setTimeout(() => {
        setError(null);
        setCardError(null);
      }, 6000);
      setErrorTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [error, cardError]);

  const validateCardElement = (cardElement: any): boolean => {
    if (!cardElement) {
      return false;
    }
    // Check if card element has been filled
    // The CardElement doesn't expose direct validation, but we can check by attempting to use it
    return true;
  };

  const handleSubmit = async (
    event: React.FormEvent,
    elements: any,
    stripe: any,
  ) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      const msg = "Card form not properly initialized";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setError(null);
    setCardError(null);

    try {
      // Step 1: Create payment intent on backend FIRST (to get payment_intent_id)
      let paymentIntentResponse;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        paymentIntentResponse = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            email,
            imageUrl: image,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (err) {
        setProcessing(false);
        const errorMsg =
          err instanceof Error && err.name === "AbortError"
            ? "Payment service request timed out"
            : "Network error: Unable to connect to payment service";
        throw new Error(errorMsg);
      }

      if (!paymentIntentResponse.ok) {
        let errorMessage = "Failed to create payment intent";
        try {
          const errorData = await paymentIntentResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${paymentIntentResponse.status}`;
        }
        throw new Error(errorMessage);
      }

      let paymentIntentData;
      try {
        paymentIntentData = await paymentIntentResponse.json();
      } catch {
        throw new Error("Invalid response from payment service");
      }

      if (!paymentIntentData.clientSecret) {
        throw new Error("No payment secret received");
      }

      const paymentIntentId =
        paymentIntentData.clientSecret?.split("_secret_")[0];

      // Step 1.5: Save pending payment record to database with payment_intent_id
      try {
        await fetch("/api/save-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            duration: parseInt(duration),
            resolution: quality,
            paymentIntentId,
            paymentAmount: amount,
            paymentCurrency: "usd",
            paymentStatus: "payment_pending",
            paymentMethodType: "card",
            paymentEmail: email,
          }),
        });
      } catch (err) {
        console.warn("Failed to save initial payment record", err);
        // Continue anyway, webhook will still process
      }

      // Step 2: Confirm payment with Stripe
      const { paymentIntent, error: stripeError } =
        await stripe.confirmCardPayment(paymentIntentData.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { email },
          },
        });

      if (stripeError) {
        // Check for card validation errors
        if (
          stripeError.code === "card_error" ||
          stripeError.type === "card_error"
        ) {
          const msg = `Card error: ${stripeError.message}`;
          setCardError(msg);
          toast({
            title: "Card Error",
            description: msg,
            variant: "destructive",
          });
        } else {
          throw new Error(stripeError.message || "Payment failed");
        }
        setProcessing(false);
        return;
      }

      if (!paymentIntent) {
        throw new Error("Payment intent not returned");
      }

      if (paymentIntent.status !== "succeeded") {
        throw new Error(
          `Payment status: ${paymentIntent.status}. Please try again.`,
        );
      }

      // Step 3: Generate video after successful payment
      let videoUrl = "";
      let requestId = "";

      try {
        const generateResponse = await fetch("/api/generate-video", {
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
        });

        if (generateResponse.ok) {
          const generateData = await generateResponse.json();
          videoUrl = generateData.videoUrl || "";
          requestId = generateData.requestId || "";
        } else {
          console.warn("Video generation started but may be processing");
        }
      } catch (err) {
        console.warn("Video generation error:", err);
      }

      // Step 4: Save video to database with payment data
      if (requestId || videoUrl) {
        try {
          await fetch("/api/save-video", {
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
              paymentIntentId: paymentIntent.id,
              paymentAmount: amount,
              paymentCurrency: "usd",
              paymentStatus: paymentIntent.status,
              paymentMethodType:
                paymentIntent.payment_method_types?.[0] || "card",
              paymentEmail: email,
            }),
          });
        } catch (err) {
          console.warn("Failed to save video to database", err);
        }
      }

      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ElementsConsumer>
      {({ elements, stripe }) => (
        <form
          onSubmit={(e) => handleSubmit(e, elements, stripe)}
          className="space-y-6"
        >
          {/* Card Input */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "14px",
                    color: "#fff",
                    "::placeholder": {
                      color: "#9ca3af",
                    },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>

          {/* Error Message - Dismissible */}
          {(error || cardError) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 flex-1">
                {error || cardError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCardError(null);
                  if (errorTimeout) {
                    clearTimeout(errorTimeout);
                    setErrorTimeout(null);
                  }
                }}
                className="text-red-400 hover:text-red-300 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Amount Info */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Total amount</p>
            <p className="text-3xl font-bold text-white">
              ${amount.toFixed(2)}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800 h-12"
              onClick={onCancel}
              disabled={processing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={processing || !stripe}
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
      )}
    </ElementsConsumer>
  );
};

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CardForm {...props} />
    </Elements>
  );
}
