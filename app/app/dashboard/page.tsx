"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft,
  PlugZap, BarChart3, RefreshCw, Users, FileText, CreditCard, FileSpreadsheet, Building2, ChevronDown, Check, Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { AICfoLogo } from "@/components/ui/ai-cfo-logo";

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
  iconNode,
  label,
  href,
  color,
}: {
  icon?: React.ElementType;
  iconNode?: React.ReactNode;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-center shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)]"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.12),transparent_55%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset transition-colors", color)}>
        {iconNode ?? (Icon ? <Icon className="h-4 w-4" strokeWidth={1.9} /> : null)}
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </Link>
  );
}

function CashflowPremiumLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M3 17.5h18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5.5 14.5c1.7-2.1 3-2.1 4.7 0 1.7 2.1 3 2.1 4.7 0 1.7-2.1 3-2.1 4.6 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M16.7 8.3h3.8v3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 8.3l-6.2 6.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { tenantId, companyId, setCompanyId, fromIso, toIso, todayIso } = useAppState();
  const api = useApi();
  const router = useRouter();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const companyMenuRef = useRef<HTMLDivElement | null>(null);

  const companies = useQuery({
    queryKey: ["companies", tenantId],
    queryFn: () => api.companies.list(tenantId).then((r) => r.data),
    enabled: !!tenantId,
  });

  const companyList = useMemo(
    () => (companies.data?.companies ?? []) as Array<{ id: string; name: string }>,
    [companies.data?.companies],
  );
  const activeCompany = companyList.find((c: { id: string; name: string }) => c.id === companyId);
  const selectedCompanyId = activeCompany?.id ?? "";
  const enabled = !!selectedCompanyId;

  useEffect(() => {
    if (!companies.isSuccess) return;
    if (!companyId) return;
    const exists = companyList.some((c: { id: string; name: string }) => c.id === companyId);
    if (!exists) {
      setCompanyId("");
    }
  }, [companies.isSuccess, companyId, companyList, setCompanyId]);

  const pnl = useQuery({
    queryKey: ["pnl", tenantId, selectedCompanyId, fromIso, toIso],
    queryFn: () => api.insights.pnl(tenantId, selectedCompanyId, fromIso, toIso).then((r) => r.data),
    enabled,
  });

  const cashflow = useQuery({
    queryKey: ["cashflow", tenantId, selectedCompanyId, fromIso, toIso],
    queryFn: () =>
      api.insights.cashflow(tenantId, selectedCompanyId, fromIso, toIso).then((r) => r.data),
    enabled,
  });

  const receivables = useQuery({
    queryKey: ["receivables", tenantId, selectedCompanyId, todayIso],
    queryFn: () =>
      api.insights.receivables(tenantId, selectedCompanyId, todayIso, 8).then((r) => r.data),
    enabled,
  });

  const payables = useQuery({
    queryKey: ["payables", tenantId, selectedCompanyId, todayIso],
    queryFn: () =>
      api.insights.payables(tenantId, selectedCompanyId, todayIso, 8).then((r) => r.data),
    enabled,
  });

  const hasNoData =
    (!enabled && !pnl.isLoading) ||
    pnl.isError ||
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

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!companyMenuRef.current) return;
      if (!companyMenuRef.current.contains(event.target as Node)) {
        setShowCompanyMenu(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className="flex flex-col">
      <Topbar title="Dashboard" />

      <div className="mx-auto w-full max-w-[1320px] space-y-4 px-6 py-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] px-5 py-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div>
              <p className="text-[13px] font-semibold leading-tight text-foreground">Plan limits are active</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Starter includes 1 company, AI CFO locked, and 2 reports/month.{" "}
                <Link href="/pricing" className="font-semibold text-primary hover:underline">
                  Upgrade to Growth
                </Link>
                {" "}for AI CFO, unlimited reports, and up to 3 companies.
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-visible rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm">
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Company</p>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {(companies.data?.companies ?? []).length} connected
              </p>
            </div>
            <div className="relative z-10" ref={companyMenuRef}>
              <button
                type="button"
                onClick={() => setShowCompanyMenu((v) => !v)}
                className="inline-flex h-11 min-w-[330px] items-center justify-between gap-2 rounded-xl border border-border/80 bg-background px-4 text-sm font-semibold text-foreground outline-none transition hover:border-primary/35 focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                aria-haspopup="listbox"
                aria-expanded={showCompanyMenu}
                aria-label="Switch company"
              >
                <span className="truncate">
                  {activeCompany?.name || "No company available"}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showCompanyMenu && "rotate-180")} />
              </button>

              {showCompanyMenu && (
                <div className="absolute right-0 z-20 mt-2 w-[330px] overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_40px_rgba(2,6,23,0.18)]">
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {companyList.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">No company available</p>
                    ) : (
                      companyList.map((c: { id: string; name: string }) => {
                        const active = c.id === companyId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCompanyId(c.id);
                              setShowCompanyMenu(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition",
                              active
                                ? "bg-primary/15 text-foreground"
                                : "text-foreground hover:bg-secondary",
                            )}
                          >
                            <span className="truncate">{c.name || c.id}</span>
                            {active && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
              <div className="flex flex-wrap gap-2.5">
                <QuickAction icon={PlugZap} label="Connect Tally" href="/app/connect" color="bg-blue-500/14 text-blue-500 ring-blue-500/30" />
                <QuickAction icon={FileSpreadsheet} label="Generate Report" href="/app/reports" color="bg-emerald-500/14 text-emerald-500 ring-emerald-500/30" />
                <QuickAction iconNode={<AICfoLogo className="h-4 w-4 text-indigo-500" />} label="Ask AI CFO" href="/app/ask" color="bg-indigo-500/14 text-indigo-500 ring-indigo-500/30" />
                <QuickAction iconNode={<CashflowPremiumLogo className="text-cyan-500" />} label="View Reports" href="/app/reports" color="bg-cyan-500/14 text-cyan-500 ring-cyan-500/30" />
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
