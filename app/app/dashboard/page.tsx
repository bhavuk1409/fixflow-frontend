"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft,
  Cable, BarChart3, RefreshCw, Users, CreditCard, Sparkles, FileText, Loader2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/store";
import { useApi } from "@/lib/useApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Topbar } from "@/components/layout/Topbar";
import { KpiSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { AiInsightsPanel } from "@/components/ui/ai-insights-panel";
import { ConnectTallyEmptyState } from "@/components/ui/empty-state";
import { CashflowChart, ExpenseBarChart } from "@/components/ui/charts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PnlLineItem = {
  category: string;
  amount: number | string;
  ledger_name: string;
};

type CashflowMonth = {
  year: number;
  month: number;
  inflow: number | string;
  outflow: number | string;
  net: number | string;
};

type OutstandingParty = {
  party_name: string;
  oldest_date: string;
  amount: number | string;
};

type MonthlyChartPoint = {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
};

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

// Section header sub-component
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

// Party table row
function PartyRow({
  party,
  date,
  amount,
  color,
}: {
  party: string;
  date: string;
  amount: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-secondary/50">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sm font-medium text-foreground">{party}</p>
        <p className="text-xs text-muted-foreground">Since {date}</p>
      </div>
      <span className={cn("ml-4 flex-shrink-0 text-sm font-semibold tabular", color)}>{amount}</span>
    </div>
  );
}

// Quick action button
function QuickAction({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-dark-hover"
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { tenantId, companyId, fromIso, toIso, todayIso } = useAppState();
  const api = useApi();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const enabled = !!companyId;

  const pnl = useQuery({
    queryKey: ["pnl", tenantId, companyId, fromIso, toIso],
    queryFn: () => api.insights.pnl(tenantId, companyId, fromIso, toIso).then((r) => r.data),
    enabled,
  });

  const cashflow = useQuery({
    queryKey: ["cashflow", tenantId, companyId, fromIso, toIso],
    queryFn: () =>
      api.insights.cashflow(tenantId, companyId, fromIso, toIso).then((r) => r.data),
    enabled,
  });

  const receivables = useQuery({
    queryKey: ["receivables", tenantId, companyId, todayIso],
    queryFn: () =>
      api.insights.receivables(tenantId, companyId, todayIso, 8).then((r) => r.data),
    enabled,
  });

  const payables = useQuery({
    queryKey: ["payables", tenantId, companyId, todayIso],
    queryFn: () =>
      api.insights.payables(tenantId, companyId, todayIso, 8).then((r) => r.data),
    enabled,
  });

  const hasNoData =
    (!enabled && !pnl.isLoading) ||
    (enabled && pnl.isSuccess && !pnl.data?.total_income && !pnl.data?.cost_of_goods);

  // Show loading skeletons while enabled but data hasn't arrived yet
  const isLoading = enabled && (pnl.isLoading || pnl.isFetching);

  // Top expense ledgers — from line_items where category is cost/expense
  const expenseLedgers =
    pnl.data?.line_items
      ?.filter((r: PnlLineItem) => r.category === "cost_of_goods" || r.category === "direct_expenses" || r.category === "indirect_expenses")
      .sort((a: PnlLineItem, b: PnlLineItem) => Number(b.amount) - Number(a.amount))
      .slice(0, 6)
      .map((r: PnlLineItem) => ({ name: r.ledger_name.slice(0, 16), value: Math.abs(Number(r.amount)) })) ?? [];

  // Build dynamic AI insights
  const income = Number(pnl.data?.total_income ?? 0);
  const expense = Number(pnl.data?.cost_of_goods ?? 0) + Number(pnl.data?.direct_expenses ?? 0) + Number(pnl.data?.indirect_expenses ?? 0);
  const netProfit = Number(pnl.data?.net_profit ?? 0);
  const netCashflow = Number(cashflow.data?.net_cashflow ?? 0);
  const totalReceivables = Number(receivables.data?.total_outstanding ?? 0);
  const totalPayables = Number(payables.data?.total_outstanding ?? 0);

  // Map monthly array to chart-friendly format with a readable month label
  const monthlyChartData: MonthlyChartPoint[] = (cashflow.data?.monthly ?? []).map((m: CashflowMonth) => ({
    month: new Date(m.year, m.month - 1).toLocaleString("default", { month: "short", year: "2-digit" }),
    inflow: Number(m.inflow),
    outflow: Number(m.outflow),
    net: Number(m.net),
  }));

  const dynamicInsights = pnl.data ? [
    {
      type: (netProfit >= 0 ? "positive" : "warning") as "positive" | "warning" | "info",
      title: netProfit >= 0 ? `Net profit: ${formatCurrency(netProfit, true)}` : `Loss period: ${formatCurrency(Math.abs(netProfit), true)}`,
      description: netProfit >= 0
        ? `Revenue of ${formatCurrency(income, true)} exceeded expenses of ${formatCurrency(expense, true)}.`
        : `Expenses exceeded revenue by ${formatCurrency(Math.abs(netProfit), true)} this period.`,
    },
    {
      type: (totalReceivables > income * 0.3 ? "warning" : "info") as "positive" | "warning" | "info",
      title: `Receivables: ${formatCurrency(totalReceivables, true)}`,
      description: totalReceivables > income * 0.3
        ? "High receivables relative to income. Consider following up with debtors."
        : "Receivables are within a healthy range compared to income.",
    },
    ...(expenseLedgers[0] ? [{
      type: "info" as const,
      title: `Top expense: ${expenseLedgers[0].name}`,
      description: `${expenseLedgers[0].name} accounts for ${Math.round((expenseLedgers[0].value / Math.abs(expense)) * 100)}% of total outflows.`,
    }] : []),
  ] : undefined;

  const handleUpgradePlan = async () => {
    if (!isSignedIn || !user) {
      toast.message("Sign in to upgrade your plan.");
      router.push("/sign-in?redirect_url=/app/dashboard");
      return;
    }

    setUpgradeLoading(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout.");
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
        description: "Fixflow Growth Plan (₹99/month)",
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
            toast.message("Checkout cancelled.");
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
            toast.success("Plan upgraded successfully (₹99/month).");
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Payment verification failed.";
            toast.error(message);
          }
        },
      });

      checkout.on("payment.failed", (event) => {
        const reason = event.error?.description || event.error?.reason || "Payment failed.";
        toast.error(reason);
      });

      checkout.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      toast.error(message);
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Topbar title="Dashboard" />

      <div className="space-y-6 p-6">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Upgrade to Growth</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Unlock full AI CFO features, advanced insights, and priority support for ₹99/month.
              </p>
            </div>
            <button
              onClick={handleUpgradePlan}
              disabled={upgradeLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-70"
            >
              {upgradeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Upgrade Plan · ₹99/mo
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {pnl.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {[...Array(6)].map((_, i) => <KpiSkeleton key={i} />)}
          </div>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {[...Array(6)].map((_, i) => <KpiSkeleton key={i} />)}
          </div>
        ) : hasNoData ? (
          <ConnectTallyEmptyState />
        ) : (
          <>
            {/* Welcome / refresh row */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Financial Overview</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Live data from your Tally</p>
              </div>
              <button
                onClick={() => {
                  pnl.refetch();
                  cashflow.refetch();
                  receivables.refetch();
                  payables.refetch();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {/* 6 KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard
                index={0}
                label="Total Income"
                value={formatCurrency(income, true)}
                change="+vs last period"
                trend="up"
                icon={TrendingUp}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                subLabel="Booking-period revenue"
                sparkline={monthlyChartData.map((m) => ({ value: m.inflow }))}
              />
              <KpiCard
                index={1}
                label="Total Expense"
                value={formatCurrency(expense, true)}
                change="All outflows"
                trend="neutral"
                icon={TrendingDown}
                iconColor="text-red-500"
                iconBg="bg-red-50 dark:bg-red-500/10"
                subLabel="Period outflows"
                sparkline={monthlyChartData.map((m) => ({ value: m.outflow }))}
              />
              <KpiCard
                index={2}
                label="Net Profit"
                value={formatCurrency(netProfit, true)}
                change={netProfit >= 0 ? "Profitable period" : "Loss period"}
                trend={netProfit >= 0 ? "up" : "down"}
                icon={Wallet}
                iconColor={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
                iconBg={netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}
                subLabel="Income minus expenses"
              />
              <KpiCard
                index={3}
                label="Net Cashflow"
                value={formatCurrency(netCashflow, true)}
                change={netCashflow >= 0 ? "Positive flow" : "Negative flow"}
                trend={netCashflow >= 0 ? "up" : "down"}
                icon={netCashflow >= 0 ? ArrowUpRight : ArrowDownLeft}
                iconColor={netCashflow >= 0 ? "text-emerald-500" : "text-amber-500"}
                iconBg={netCashflow >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}
                subLabel="Inflow minus outflow"
              />
              <KpiCard
                index={4}
                label="Receivables"
                value={formatCurrency(totalReceivables, true)}
                change={totalReceivables > 0 ? `${receivables.data?.parties?.length ?? 0} parties` : "All clear"}
                trend={totalReceivables > income * 0.3 ? "down" : "neutral"}
                icon={Users}
                iconColor="text-blue-500"
                iconBg="bg-blue-50 dark:bg-blue-500/10"
                subLabel="Outstanding receivable"
              />
              <KpiCard
                index={5}
                label="Payables"
                value={formatCurrency(totalPayables, true)}
                change={totalPayables > 0 ? `${payables.data?.parties?.length ?? 0} parties` : "All paid"}
                trend={totalPayables > expense * 0.3 ? "down" : "neutral"}
                icon={CreditCard}
                iconColor="text-amber-500"
                iconBg="bg-amber-50 dark:bg-amber-500/10"
                subLabel="Outstanding payable"
              />
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <QuickAction icon={Cable}    label="Connect Tally"    href="/app/connect"   color="bg-primary/10 text-primary group-hover:bg-primary/15" />
                <QuickAction icon={FileText} label="Generate Report"  href="/app/reports"   color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
                <QuickAction icon={Sparkles} label="Ask AI CFO"       href="/app/ask"       color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
                <QuickAction icon={BarChart3} label="View Reports"    href="/app/reports"   color="bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary" />
              </div>
            </div>

            {/* Charts + AI Insights row */}
            <div className="grid gap-6 xl:grid-cols-3">
              {/* Cashflow chart — span 2 cols */}
              <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card xl:col-span-2">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Monthly Cashflow</h3>
                  </div>
                  <Link href="/app/reports" className="text-xs font-medium text-primary hover:underline">
                    View reports →
                  </Link>
                </div>
                <div className="p-5">
                  {cashflow.isLoading ? (
                    <ChartSkeleton height={220} />
                  ) : monthlyChartData.length === 0 ? (
                    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                      No cashflow data in this period
                    </div>
                  ) : (
                    <CashflowChart data={monthlyChartData} height={220} />
                  )}
                </div>
              </div>

              {/* AI Insights Panel */}
              <AiInsightsPanel
                insights={dynamicInsights}
                isLoading={pnl.isLoading}
                onAskMore={(q) => router.push(q ? `/app/ask?q=${encodeURIComponent(q)}` : "/app/ask")}
              />
            </div>

            {/* Bottom row: Expenses + Receivables + Payables */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Top Expenses */}
              <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold">Top Expense Ledgers</h3>
                </div>
                <div className="p-5">
                  {pnl.isLoading ? (
                    <ChartSkeleton height={220} />
                  ) : expenseLedgers.length === 0 ? (
                    <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                      No expense data
                    </div>
                  ) : (
                    <ExpenseBarChart data={expenseLedgers} height={220} />
                  )}
                </div>
              </div>

              {/* Top Receivables */}
              <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold">Top Receivables</h3>
                  <span className="text-xs font-semibold tabular text-emerald-600 dark:text-emerald-400">
                    {receivables.data ? formatCurrency(Number(receivables.data.total_outstanding), true) : "—"}
                  </span>
                </div>
                <div className="flex-1 divide-y divide-border overflow-hidden rounded-b-2xl">
                  {receivables.isLoading ? (
                    <div className="p-5"><TableSkeleton rows={5} /></div>
                  ) : (receivables.data?.parties ?? []).length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No receivables</p>
                  ) : (
                    (receivables.data?.parties ?? []).map((row: OutstandingParty) => (
                      <PartyRow
                        key={row.party_name}
                        party={row.party_name}
                        date={formatDate(row.oldest_date)}
                        amount={formatCurrency(Number(row.amount), true)}
                        color="text-emerald-600 dark:text-emerald-400"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Top Payables */}
              <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold">Top Payables</h3>
                  <span className="text-xs font-semibold tabular text-red-500 dark:text-red-400">
                    {payables.data ? formatCurrency(Number(payables.data.total_outstanding), true) : "—"}
                  </span>
                </div>
                <div className="flex-1 divide-y divide-border overflow-hidden rounded-b-2xl">
                  {payables.isLoading ? (
                    <div className="p-5"><TableSkeleton rows={5} /></div>
                  ) : (payables.data?.parties ?? []).length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No payables</p>
                  ) : (
                    (payables.data?.parties ?? []).map((row: OutstandingParty) => (
                      <PartyRow
                        key={row.party_name}
                        party={row.party_name}
                        date={formatDate(row.oldest_date)}
                        amount={formatCurrency(Number(row.amount), true)}
                        color="text-red-500 dark:text-red-400"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
