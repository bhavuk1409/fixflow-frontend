"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { getTenantId } from "@/lib/auth";
import { useApi } from "@/lib/useApi";

type BillingSettings = {
  plan_active: boolean;
  plan_id: string | null;
  plan_billing_cycle: string | null;
  razorpay_subscription_id: string | null;
  razorpay_subscription_status: string | null;
};

type RazorpaySuccessPayload = {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    paylater?: boolean;
    emi?: boolean;
  };
  handler: (response: RazorpaySuccessPayload) => void | Promise<void>;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (payload: { error?: { description?: string } }) => void,
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in browser."));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => {
          razorpayScriptPromise = null;
          reject(new Error("Unable to load Razorpay checkout script."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Unable to load Razorpay checkout script."));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export default function PricingPage() {
  const router = useRouter();
  const api = useApi();
  const { isLoaded, isSignedIn, user } = useUser();
  const { organization } = useOrganization();

  const tenantId = useMemo(
    () => getTenantId(organization?.id, user?.id),
    [organization?.id, user?.id],
  );

  const [isCheckoutBusy, setIsCheckoutBusy] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in?redirect_url=/pricing");
    }
  }, [isLoaded, isSignedIn, router]);

  const settings = useQuery({
    queryKey: ["settings", tenantId],
    enabled: isLoaded && Boolean(isSignedIn) && Boolean(tenantId),
    queryFn: async () => {
      const res = await api.settings.get(tenantId);
      return res.data as BillingSettings;
    },
  });

  const isGrowthActive = Boolean(
    settings.data?.plan_active && settings.data?.plan_id === "growth",
  );

  const startGrowthSubscription = async () => {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/pricing");
      return;
    }
    if (!tenantId) {
      toast.error("Unable to resolve tenant. Please re-login.");
      return;
    }

    setIsCheckoutBusy(true);
    try {
      await loadRazorpayScript();

      const customerName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || undefined;
      const customerEmail = user?.primaryEmailAddress?.emailAddress || undefined;

      const createRes = await api.payments.createRazorpaySubscription(tenantId, {
        billing_cycle: "monthly",
        customer_name: customerName,
        customer_email: customerEmail,
      });
      const usingTestKey = createRes.data.key_id.startsWith("rzp_test");
      setIsTestMode(usingTestKey);

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to initialize.");
      }

      const checkout = new window.Razorpay({
        key: createRes.data.key_id,
        subscription_id: createRes.data.subscription_id,
        name: createRes.data.business_name,
        description: createRes.data.description,
        prefill: {
          name: customerName,
          email: customerEmail,
        },
        notes: {
          tenant_id: tenantId,
          plan_id: "growth",
          billing_cycle: "monthly",
        },
        theme: {
          color: "#16a34a",
        },
        method: {
          upi: false,
          card: true,
          netbanking: true,
          wallet: false,
          paylater: false,
          emi: false,
        },
        modal: {
          ondismiss: () => setIsCheckoutBusy(false),
        },
        handler: async (response: RazorpaySuccessPayload) => {
          setIsVerifying(true);
          try {
            await api.payments.verifyRazorpaySubscription(tenantId, {
              billing_cycle: "monthly",
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Growth subscription activated.");
            await settings.refetch();
            router.push("/app/dashboard");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Subscription verification failed.";
            toast.error(message);
          } finally {
            setIsVerifying(false);
            setIsCheckoutBusy(false);
          }
        },
      });

      checkout.on("payment.failed", (payload) => {
        const msg = payload.error?.description || "Payment failed. Please try again.";
        toast.error(msg);
        setIsCheckoutBusy(false);
      });

      checkout.open();
      if (usingTestKey) {
        toast.message("Test mode enabled: use Razorpay test cards/netbanking for recurring mandates.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start subscription.";
      toast.error(message);
      setIsCheckoutBusy(false);
    }
  };

  const cancelGrowthSubscription = async () => {
    if (!tenantId) {
      toast.error("Unable to resolve tenant.");
      return;
    }
    if (!window.confirm("Cancel your Growth subscription immediately?")) {
      return;
    }

    setIsCancelling(true);
    try {
      await api.payments.cancelRazorpaySubscription(tenantId);
      toast.success("Subscription cancelled.");
      await settings.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel subscription.";
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-[#E6EDF3]">
        <div className="flex items-center gap-3 rounded-xl border border-[#232A34] bg-[#111620] px-5 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading billing...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] px-4 py-12 text-[#E6EDF3] sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-[#232A34] bg-[#111620] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4ade80]">
            Billing
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Fixflow Growth</h1>
          <p className="mt-2 text-sm text-[#9AA4B2]">
            Unlock full limits with Growth at <span className="font-semibold text-white">₹299/month</span>.
          </p>
          {isTestMode && (
            <p className="mt-2 text-xs text-amber-300">
              You are using Razorpay test mode. Subscription mandates work only with test payment instruments.
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-[#253042] bg-[#0E141D] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {isGrowthActive ? "Growth is active" : "Starter is active"}
                </p>
                <p className="mt-1 text-xs text-[#9AA4B2]">
                  {isGrowthActive
                    ? "You have paid limits for companies, AI CFO, and reports."
                    : "Starter includes 1 company, 5 AI CFO queries/month, and 2 reports/month."}
                </p>
              </div>
              {isGrowthActive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                  <XCircle className="h-3.5 w-3.5" />
                  Starter
                </span>
              )}
            </div>

            <ul className="mt-4 space-y-2 text-sm text-[#C7D0DD]">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
                Up to 5 Tally companies
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
                Unlimited AI CFO queries
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
                Unlimited report generation + weekly automation
              </li>
            </ul>

            {settings.data?.razorpay_subscription_id && (
              <p className="mt-4 text-xs text-[#9AA4B2]">
                Subscription ID:{" "}
                <span className="font-mono text-[#D8DEE9]">
                  {settings.data.razorpay_subscription_id}
                </span>
              </p>
            )}
            <p className="mt-2 text-xs text-[#9AA4B2]">
              Offers appear only when a Razorpay subscription offer is linked (`offer_id`) for this plan.
            </p>
          </div>

          {settings.isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-[#9AA4B2]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subscription status...
            </div>
          ) : settings.isError ? (
            <p className="mt-6 text-sm text-red-300">
              {settings.error instanceof Error
                ? settings.error.message
                : "Unable to load billing settings. Please refresh and try again."}
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {!isGrowthActive && (
                <button
                  type="button"
                  onClick={startGrowthSubscription}
                  disabled={isCheckoutBusy || isVerifying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4ade80] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {(isCheckoutBusy || isVerifying) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isVerifying ? "Verifying payment..." : "Subscribe ₹299/month"}
                </button>
              )}

              <Link
                href="/app/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-[#2B3441] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#E6EDF3] transition hover:bg-[#1A2230]"
              >
                Back to dashboard
              </Link>

              {isGrowthActive && settings.data?.razorpay_subscription_id && (
                <button
                  type="button"
                  onClick={cancelGrowthSubscription}
                  disabled={isCancelling}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cancel subscription
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
