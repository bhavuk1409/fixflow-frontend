"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();

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
  const subscriptionStatus = (settings.data?.razorpay_subscription_status || "").toLowerCase();
  const hasSubscriptionId = Boolean(settings.data?.razorpay_subscription_id);
  const canCancelSubscription =
    hasSubscriptionId &&
    !["cancelled", "completed", "expired", "halted"].includes(subscriptionStatus);
  const razorpayThemeColor = resolvedTheme === "light" ? "#2563eb" : "#3b82f6";

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
          color: razorpayThemeColor,
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
    if (!window.confirm("Unsubscribe from Growth now? This will stop recurring auto-pay.")) {
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden dark:block"
        >
          <div
            className="absolute left-[12%] top-[-14%] h-[420px] w-[420px] rounded-full opacity-[0.08]"
            style={{
              background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
              filter: "blur(78px)",
            }}
          />
        </div>
        <div className="relative z-10 flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-card dark:shadow-card-dark">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading billing...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute inset-x-0 top-0 h-[380px] opacity-80 dark:hidden"
          style={{
            background: "radial-gradient(ellipse 75% 60% at 50% -10%, rgba(59,130,246,0.16), transparent 72%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 hidden h-[420px] dark:block"
          style={{
            background: "radial-gradient(ellipse 80% 62% at 50% -12%, rgba(59,130,246,0.18), transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-border bg-card/95 p-7 shadow-card-hover backdrop-blur sm:p-9 dark:bg-card/90 dark:shadow-card-dark-hover">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Billing
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Fixflow Growth</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlock full limits with Growth at <span className="font-semibold text-foreground">₹299/month</span>.
          </p>
          {isTestMode && (
            <p className="mt-2 text-xs text-warning">
              You are using Razorpay test mode. Subscription mandates work only with test payment instruments.
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-background/65 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isGrowthActive ? "Growth is active" : "Starter is active"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isGrowthActive
                    ? "You have paid limits for companies, AI CFO, and reports."
                    : "Starter includes 1 company, 5 AI CFO queries/month, and 2 reports/month."}
                </p>
              </div>
              {isGrowthActive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/35 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                  <XCircle className="h-3.5 w-3.5" />
                  Starter
                </span>
              )}
            </div>

            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Up to 5 Tally companies
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Unlimited AI CFO queries
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Unlimited report generation + weekly automation
              </li>
            </ul>

            {settings.data?.razorpay_subscription_id && (
              <p className="mt-4 text-xs text-muted-foreground">
                Subscription ID:{" "}
                <span className="font-mono text-foreground">
                  {settings.data.razorpay_subscription_id}
                </span>
              </p>
            )}
            {settings.data?.razorpay_subscription_status && (
              <p className="mt-1 text-xs text-muted-foreground">
                Status:{" "}
                <span className="font-medium capitalize text-foreground">
                  {settings.data.razorpay_subscription_status}
                </span>
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Offers appear only when a Razorpay subscription offer is linked (`offer_id`) for this plan.
            </p>
          </div>

          {settings.isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subscription status...
            </div>
          ) : settings.isError ? (
            <p className="mt-6 text-sm text-destructive">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                Back to dashboard
              </Link>

              {canCancelSubscription && (
                <button
                  type="button"
                  onClick={cancelGrowthSubscription}
                  disabled={isCancelling}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                  Unsubscribe
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
