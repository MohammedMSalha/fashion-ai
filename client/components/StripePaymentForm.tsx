import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  ElementsConsumer,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface StripePaymentFormProps {
  amount: number;
  email: string;
  image: string;
  duration: "5s" | "10s";
  quality: "720p" | "1080p";
  onSuccess: () => void;
  onCancel: () => void;
}

const stripePromise = loadStripe(
  "pk_test_51SLjzIFKPN8vxl5YLX6M3Wg3e2zLBEIb8QaWGCgO1xfzI1aCxpIVxwhjCExKVtduI0Zln9uoEg4Hqy8i1iyMmWL5002Kw1N8Lz",
);

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

  const handleSubmit = async (
    event: React.FormEvent,
    elements: any,
    stripe: any,
  ) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create payment intent on backend
      const paymentIntentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          email,
        }),
      });

      if (!paymentIntentResponse.ok) {
        const errorData = await paymentIntentResponse.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const { clientSecret } = await paymentIntentResponse.json();

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error: stripeError } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { email },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Step 3: Generate video after successful payment
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

        let videoUrl = "";
        if (generateResponse.ok) {
          const generateData = await generateResponse.json();
          videoUrl = generateData.videoUrl || "";
        } else {
          console.warn("Video generation started but may be processing");
        }

        // Step 4: Save video to database
        if (videoUrl) {
          await fetch("/api/save-video", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              videoUrl,
              duration: parseInt(duration),
              resolution: quality,
            }),
          }).catch((err) =>
            console.warn("Failed to save video to database", err),
          );
        }

        onSuccess();
      } else {
        setError("Payment was not completed successfully");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
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
