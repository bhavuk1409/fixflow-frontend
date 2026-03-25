"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTenantId } from "@/lib/auth";
import { useApi } from "@/lib/useApi";

type RazorpayHandlerResponse = {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color: string };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (
        event: "payment.failed",
        callback: (response: RazorpayFailureResponse) => void,
      ) => void;
    };
  }
}

const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return await new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const api = useApi();
  const { isSignedIn, user } = useUser();
  const { organization } = useOrganization();
  const startedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (startedRef.current) return;
      if (isSignedIn === undefined) return;

      if (!isSignedIn || !user) {
        router.replace("/sign-in?redirect_url=/pricing");
        return;
      }

      startedRef.current = true;
      const tenantId = getTenantId(organization?.id, user?.id);

      try {
        const scriptReady = await loadRazorpayScript();
        if (!scriptReady || !window.Razorpay) {
          throw new Error("Unable to load checkout.");
        }

        const subscriptionRes = await api.payments.createRazorpaySubscription(tenantId, {
          plan_id: "growth",
          billing_cycle: "monthly",
          customer_name: user.fullName ?? undefined,
          customer_email: user.primaryEmailAddress?.emailAddress ?? undefined,
        });
        const subscription = subscriptionRes.data;

        const checkout = new window.Razorpay({
          key: subscription.key_id,
          subscription_id: subscription.subscription_id,
          name: subscription.business_name,
          description: subscription.description,
          prefill: {
            name: user.fullName ?? "",
            email: user.primaryEmailAddress?.emailAddress ?? "",
          },
          notes: {
            tenant_id: tenantId,
            plan_id: "growth",
            billing_cycle: "monthly",
          },
          theme: { color: "#3B82F6" },
          modal: {
            ondismiss: () => {
              toast.message("Checkout closed.");
              router.replace("/app/dashboard");
            },
          },
          handler: async (response) => {
            try {
              await api.payments.verifyRazorpaySubscription(tenantId, {
                plan_id: "growth",
                billing_cycle: "monthly",
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Subscription activated.");
              router.replace("/app/settings");
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Subscription verification failed.";
              toast.message(message);
              router.replace("/app/dashboard");
            }
          },
        });

        checkout.on("payment.failed", (event) => {
          const reason = event.error?.description || event.error?.reason || "Payment failed.";
          toast.message(reason);
          router.replace("/app/dashboard");
        });

        checkout.open();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start checkout.";
        toast.message(message);
        router.replace("/app/dashboard");
      }
    };

    run();
  }, [api, isSignedIn, organization?.id, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-[#E6EDF3]">
      <div className="flex items-center gap-3 rounded-xl border border-[#232A34] bg-[#111620] px-5 py-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecting to secure checkout...
      </div>
    </div>
  );
}
