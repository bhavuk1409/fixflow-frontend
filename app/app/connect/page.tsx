"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Copy, Check, RefreshCw, Monitor, Apple, AlertCircle, Info,
  ExternalLink, Zap, CheckCircle2, Clock, Download, Wifi, WifiOff,
  PartyPopper, Building2, Unplug, ShieldAlert,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { useApi } from "@/lib/useApi";
import { Topbar } from "@/components/layout/Topbar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/api";

// ── Disconnect confirmation modal ──────────────────────────────────────────
function DisconnectModal({
  company,
  onConfirm,
  onCancel,
}: {
  company: Company;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed === company.name;

  function handleDisconnect(e: React.FormEvent) {
    e.preventDefault();
    if (matches) onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        {/* Icon + title */}
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
            <ShieldAlert className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Disconnect Tally?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will unlink{" "}
              <span className="font-semibold text-foreground">{company.name}</span>{" "}
              from Fixflow. Live sync will stop.
            </p>
          </div>
        </div>

        {/* Confirmation form */}
        <form onSubmit={handleDisconnect} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground leading-relaxed">
              To confirm, type{" "}
              <span className="select-all rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                {company.name}
              </span>{" "}
              in the box below.
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={company.name}
              autoFocus
              autoComplete="off"
              className={cn(
                "w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition",
                matches
                  ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                  : "border-border focus:border-primary focus:ring-2 focus:ring-primary/15",
              )}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!matches}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Unplug className="h-3.5 w-3.5" /> Disconnect
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Countdown timer ────────────────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const expired = remaining === 0;

  useEffect(() => {
    setRemaining(seconds);
    if (seconds === 0) return;
    const interval = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => { if (expired) onExpire(); }, [expired, onExpire]);

  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  const circumference = 2 * Math.PI * 28;
  const pct = seconds > 0 ? remaining / seconds : 0;
  const strokeColor = expired ? "#ef4444" : pct < 0.25 ? "#f97316" : "#3B82F6";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={strokeColor} strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className={cn("text-sm font-bold tabular", expired ? "text-red-500" : pct < 0.25 ? "text-amber-500" : "text-foreground")}>
          {expired ? "—" : `${m}:${s}`}
        </span>
      </div>
      <p className={cn("text-2xs font-medium", expired ? "text-red-500" : "text-muted-foreground")}>
        {expired ? "Code expired" : "Expires in"}
      </p>
    </div>
  );
}

// ── Connection steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    num: 1,
    icon: Download,
    title: "Install Fixflow Connector",
    desc: "Download and install the connector app on the Windows PC running Tally.",
    status: "pending" as const,
  },
  {
    num: 2,
    icon: Zap,
    title: "Generate pairing code",
    desc: 'Click "Generate Code" below, then launch Fixflow Connector and enter the code.',
    status: "pending" as const,
  },
  {
    num: 3,
    icon: Wifi,
    title: 'Start sync',
    desc: "Your Tally data will sync automatically. The dashboard goes live in minutes.",
    status: "pending" as const,
  },
];

// ── Download URLs ──────────────────────────────────────────────────────────
const WIN_URL = process.env.NEXT_PUBLIC_CONNECTOR_WIN_URL ?? "";
const MAC_URL = process.env.NEXT_PUBLIC_CONNECTOR_MAC_URL ?? "";
const CONNECTOR_CLOCK_SKEW_TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2h tolerance
const SLOW_SYNC_HINT_AFTER_MS = 60 * 1000;

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

type ConnectorStatusSnapshot = {
  status: string | null;
  lastSeenAtMs: number | null;
};

function toMs(value?: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function companyActivityMs(company: Company): number {
  return Math.max(toMs(company.last_synced_at) ?? 0, toMs(company.created_at) ?? 0);
}

function mostRecentCompany(companies: Company[]): Company | null {
  if (companies.length === 0) return null;
  return [...companies].sort((a, b) => companyActivityMs(b) - companyActivityMs(a))[0] ?? null;
}

function isAuthOrValidationPollError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("VALIDATION_ERROR") ||
    msg.includes("Bearer token required") ||
    msg.includes("Token does not authorise") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("422")
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ConnectPage() {
  const router = useRouter();
  const { tenantId: ctxTenantId, companyId: storedCompanyId, setCompanyId } = useAppState();
  const tenantId = ctxTenantId || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || "test_tenant";
  const api = useApi();
  const [copied, setCopied] = useState(false);
  const [pairingData, setPairingData] = useState<{ code: string; expires_in_seconds: number } | null>(null);
  const [codeExpired, setCodeExpired] = useState(false);
  const [paired, setPaired] = useState(false);
  const [syncedCompany, setSyncedCompany] = useState<Company | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const pairPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectorPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastConnectorRef = useRef<ConnectorStatusSnapshot>({ status: null, lastSeenAtMs: null });
  const initialCompanyIdsRef = useRef<Set<string> | null>(null);
  const slowSyncHintShownRef = useRef(false);
  const connectorPollErrorShownRef = useRef(false);
  const syncPollErrorShownRef = useRef(false);

  // Disconnect: clear state and localStorage
  const handleDisconnectConfirmed = useCallback(() => {
    setShowDisconnectModal(false);
    setSyncedCompany(null);
    setPaired(false);
    setPairingData(null);
    setCodeExpired(false);
    setCompanyId("");
    initialCompanyIdsRef.current = null;
    slowSyncHintShownRef.current = false;
    connectorPollErrorShownRef.current = false;
    syncPollErrorShownRef.current = false;
    toast.success("Tally disconnected successfully.");
  }, [setCompanyId]);

  // ── On mount: if we already have a companyId saved, restore connected state ──
  useEffect(() => {
    if (!storedCompanyId) return;
    api.companies.list(tenantId).then((res) => {
      const match = res.data.companies.find((c: Company) => c.id === storedCompanyId);
      if (match) {
        setSyncedCompany(match);
        setPaired(true);
      }
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connector sync status polling (starts immediately after pairing) ──
  useEffect(() => {
    if (!paired && !syncedCompany) {
      if (connectorPollRef.current) {
        clearInterval(connectorPollRef.current);
        connectorPollRef.current = null;
      }
      lastConnectorRef.current = { status: null, lastSeenAtMs: null };
      return;
    }

    const poll = async () => {
      try {
        const res = await api.connector.status(tenantId);
        const { status, error_message, last_seen_at } = res.data;
        const prev = lastConnectorRef.current.status;
        lastConnectorRef.current = {
          status,
          lastSeenAtMs: toMs(last_seen_at),
        };

        // Only toast when status transitions TO "error" (not every poll tick)
        if (status === "error" && prev !== "error") {
          toast.message(
            error_message?.includes("Cannot connect to Tally")
              ? "Tally sync failed — Tally ERP appears to be offline. Please ensure Tally is running."
              : `Sync error: ${error_message ?? "Unknown error"}`,
            { duration: 8000, id: "connector-sync-error" },
          );
        } else if (status === "ok" && prev === "error") {
          toast.success("Tally sync restored!", { id: "connector-sync-error" });
        }
      } catch (err) {
        if (!connectorPollErrorShownRef.current && isAuthOrValidationPollError(err)) {
          connectorPollErrorShownRef.current = true;
          toast.message("Connector status check failed (auth). Refresh the page and sign in again.");
        }
      }
    };

    poll(); // immediate first check
    connectorPollRef.current = setInterval(poll, 30_000); // then every 30 s
    return () => {
      if (connectorPollRef.current) {
        clearInterval(connectorPollRef.current);
        connectorPollRef.current = null;
      }
    };
  }, [api, paired, syncedCompany, tenantId]);

  // ── Phase 1: poll /pair/status until the code is exchanged ───────────
  const startPairPolling = useCallback((code: string) => {
    if (pairPollRef.current) clearInterval(pairPollRef.current);
    pairPollRef.current = setInterval(async () => {
      try {
        const res = await api.pair.status(code);
        const s = res.data.status;
        if (s === "paired") {
          clearInterval(pairPollRef.current!);
          pairPollRef.current = null;
          setPaired(true);
          toast.success("Pairing successful! Waiting for first sync…");
        } else if (s === "expired" || s === "not_found") {
          clearInterval(pairPollRef.current!);
          pairPollRef.current = null;
        }
      } catch {
        // silently ignore transient poll errors
      }
    }, 2000);
  }, [api]);

  // ── Phase 2: poll /tenants/.../companies until data arrives ──────────
  const markSynced = useCallback((company: Company) => {
    if (syncPollRef.current) {
      clearInterval(syncPollRef.current);
      syncPollRef.current = null;
    }
    setSyncedCompany(company);
    setCompanyId(company.id);
    toast.success(`${company.name} connected and synced!`);
  }, [setCompanyId]);

  const startSyncPolling = useCallback((codeGeneratedAt: number) => {
    if (syncPollRef.current) clearInterval(syncPollRef.current);
    syncPollRef.current = setInterval(async () => {
      try {
        const res = await api.companies.list(tenantId);
        const companies: Company[] = res.data.companies ?? [];
        const initialCompanyIds = initialCompanyIdsRef.current;
        const freshnessFloor = codeGeneratedAt - CONNECTOR_CLOCK_SKEW_TOLERANCE_MS;

        const newCompany =
          initialCompanyIds && companies.length > 0
            ? mostRecentCompany(companies.filter((c) => !initialCompanyIds.has(c.id)))
            : null;

        const freshCompany = newCompany ?? mostRecentCompany(
          companies.filter((c) => companyActivityMs(c) >= freshnessFloor),
        );

        if (freshCompany) {
          markSynced(freshCompany);
          return;
        }

        const heartbeat = lastConnectorRef.current;
        const heartbeatRecent =
          heartbeat.lastSeenAtMs !== null &&
          heartbeat.lastSeenAtMs >= freshnessFloor;
        if (heartbeat.status === "ok" && heartbeatRecent) {
          const fallback = mostRecentCompany(companies);
          if (fallback) {
            markSynced(fallback);
            return;
          }
        }

        if (
          !slowSyncHintShownRef.current &&
          Date.now() - codeGeneratedAt >= SLOW_SYNC_HINT_AFTER_MS
        ) {
          slowSyncHintShownRef.current = true;
          toast.info(
            "Initial sync is taking longer than usual. Keep the connector open and Tally running.",
            { duration: 7000 },
          );
        }
      } catch (err) {
        if (!syncPollErrorShownRef.current && isAuthOrValidationPollError(err)) {
          syncPollErrorShownRef.current = true;
          if (syncPollRef.current) {
            clearInterval(syncPollRef.current);
            syncPollRef.current = null;
          }
          toast.message("Sync status check failed (auth). Refresh, generate a new pairing code, and retry.");
        }
      }
    }, 3000);
  }, [api, markSynced, tenantId]);

  // ── When pairing confirmed, start sync polling ────────────────────────
  const generatedAtRef = useRef<number>(0);
  useEffect(() => {
    if (paired && !syncedCompany) {
      startSyncPolling(generatedAtRef.current);
    }
  }, [paired, syncedCompany, startSyncPolling]);

  // ── Stop polling when code expires or component unmounts ─────────────
  useEffect(() => {
    if (codeExpired) {
      if (pairPollRef.current) { clearInterval(pairPollRef.current); pairPollRef.current = null; }
      if (syncPollRef.current) { clearInterval(syncPollRef.current); syncPollRef.current = null; }
    }
  }, [codeExpired]);

  useEffect(() => {
    return () => {
      if (pairPollRef.current) clearInterval(pairPollRef.current);
      if (syncPollRef.current) clearInterval(syncPollRef.current);
      if (connectorPollRef.current) clearInterval(connectorPollRef.current);
    };
  }, []);

  const generate = useMutation({
    mutationFn: async () => {
      const generatedAt = Date.now();
      const [pairRes, companiesRes] = await Promise.all([
        api.pair.create(tenantId),
        api.companies.list(tenantId).catch(() => null),
      ]);
      const initialCompanyIds = companiesRes
        ? new Set<string>((companiesRes.data.companies ?? []).map((c: Company) => c.id))
        : null;
      return { pairData: pairRes.data, generatedAt, initialCompanyIds };
    },
    onSuccess: ({ pairData, generatedAt, initialCompanyIds }) => {
      generatedAtRef.current = generatedAt;
      initialCompanyIdsRef.current = initialCompanyIds;
      slowSyncHintShownRef.current = false;
      lastConnectorRef.current = { status: null, lastSeenAtMs: null };
      connectorPollErrorShownRef.current = false;
      syncPollErrorShownRef.current = false;
      setPairingData(pairData);
      setCodeExpired(false);
      setPaired(false);
      setSyncedCompany(null);
      setUpgradeNotice(null);
      toast.success("Pairing code ready!");
      startPairPolling(pairData.code);
    },
    onError: (e: Error) => {
      const message = String(e.message || "Unable to generate pairing code.");
      const isPlanLimit = message.includes("Starter plan allows only 1 Tally company");
      if (isPlanLimit) {
        const upgradeText = "Starter supports 1 company. Upgrade to Growth for up to 5 companies.";
        setUpgradeNotice(upgradeText);
        toast.message(upgradeText);
        return;
      }
      setUpgradeNotice(null);
      toast.message(message);
    },
  });

  const handleCopy = useCallback(() => {
    if (!pairingData) return;
    navigator.clipboard.writeText(pairingData.code).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [pairingData]);

  const handleExpire = useCallback(() => setCodeExpired(true), []);

  return (
    <div className="flex flex-col">
      <Topbar title="Connect Tally" />

      {/* Disconnect confirmation modal */}
      <AnimatePresence>
        {showDisconnectModal && syncedCompany && (
          <DisconnectModal
            company={syncedCompany}
            onConfirm={handleDisconnectConfirmed}
            onCancel={() => setShowDisconnectModal(false)}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-bold text-foreground">Connect your Tally</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pair Fixflow with your Tally ERP in under 2 minutes. No manual exports — ever.
          </p>
        </motion.div>

        {upgradeNotice && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <p className="text-sm font-medium">{upgradeNotice}</p>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800"
            >
              View plans
            </button>
          </motion.div>
        )}

        {/* 3-step visual flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="mb-5 text-sm font-semibold text-foreground">How it works</h3>
          <div className="relative flex flex-col gap-0 sm:flex-row sm:gap-0">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-1 flex-col sm:items-center">
                {/* Connector line (horizontal on desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-10 top-5 hidden h-0.5 w-[calc(100%-2.5rem)] bg-gradient-to-r from-primary/30 to-border sm:block" />
                )}
                {/* Connector line (vertical on mobile) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-5 top-10 block h-[calc(100%+1rem)] w-0.5 bg-gradient-to-b from-primary/30 to-border sm:hidden" />
                )}

                <div className="relative flex items-start gap-4 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
                  {/* Step icon */}
                  <div className={cn(
                    "relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-card transition-all",
                    pairingData && step.num === 2 ? "border-primary bg-primary/10" : "",
                  )}>
                    <step.icon className={cn("h-4 w-4", pairingData && step.num === 2 ? "text-primary" : "text-muted-foreground")} />
                    {/* Step number badge */}
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-card text-2xs font-bold text-muted-foreground ring-1 ring-border">
                      {step.num}
                    </span>
                  </div>

                  <div className="sm:px-2">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Pairing code card — left (3 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-card lg:col-span-3"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Pairing Code</h3>
            </div>

            <AnimatePresence mode="wait">
              {syncedCompany ? (
                /* ── SUCCESS: connector synced ── */
                <motion.div
                  key="synced"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-5 py-2 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                    <PartyPopper className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-500">Connected!</p>
                    <p className="mt-1 text-sm text-muted-foreground">Tally data is syncing to your dashboard.</p>
                  </div>

                  {/* Company card */}
                  <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800/40 dark:bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                        <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold text-foreground">{syncedCompany.name}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{syncedCompany.id}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(syncedCompany.id); toast.success("Company UUID copied!"); }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition hover:border-emerald-400"
                        title="Copy company UUID"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Head to the{" "}
                    <a href="/app/dashboard" className="font-semibold text-primary underline underline-offset-2">dashboard</a>
                    {" "}to see your data.
                  </p>

                  <button
                    onClick={() => { setSyncedCompany(null); setPairingData(null); setPaired(false); generate.mutate(); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <Zap className="h-3.5 w-3.5" /> Connect another company
                  </button>

                  {/* Divider */}
                  <div className="w-full border-t border-border" />

                  {/* Disconnect button */}
                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500/80 transition hover:text-red-500"
                  >
                    <Unplug className="h-3.5 w-3.5" /> Disconnect Tally
                  </button>
                </motion.div>

              ) : pairingData && !codeExpired ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="flex flex-col items-center gap-6"
                >
                  <CountdownTimer key={pairingData.code} seconds={pairingData.expires_in_seconds} onExpire={handleExpire} />

                  {/* Code display */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      aria-label="Copy pairing code"
                      className="group flex select-all items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-7 py-4 transition-all hover:border-primary/40 hover:bg-primary/8"
                    >
                      <span className="font-mono text-4xl font-extrabold tracking-[0.3em] text-primary">
                        {pairingData.code}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border shadow-sm transition group-hover:border-primary/20">
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-primary/60" />
                    Single-use · Enter in the Fixflow Connector app
                  </p>

                  {/* Status indicator: waiting → paired → syncing */}
                  {paired ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-500/5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Pairing successful! Syncing data…
                      </p>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary/60" />
                      <p className="text-xs text-muted-foreground">Waiting for connector to pair…</p>
                    </div>
                  )}

                  <button
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", generate.isPending && "animate-spin")} />
                    Regenerate code
                  </button>
                </motion.div>

              ) : codeExpired ? (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-red-500">Code expired</p>
                    <p className="mt-1 text-sm text-muted-foreground">Codes are valid for 10 minutes. Generate a fresh one.</p>
                  </div>
                  <button
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-primary transition hover:opacity-90 disabled:opacity-60"
                  >
                    <RefreshCw className={cn("h-4 w-4", generate.isPending && "animate-spin")} />
                    {generate.isPending ? "Generating…" : "New Code"}
                  </button>
                </motion.div>

              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Animated placeholder */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="h-10 w-10 rounded-full border-2 border-dashed border-primary/40"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Ready to connect?</p>
                    <p className="mt-1 text-xs text-muted-foreground">Generate a one-time pairing code to link your Tally.</p>
                  </div>
                  <button
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-glow-primary transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                  >
                    {generate.isPending ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Zap className="h-4 w-4" /> Generate Pairing Code</>
                    )}
                  </button>
                  {generate.isError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {(generate.error as Error).message}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right panel — download + status (2 cols) */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Download card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <h3 className="mb-1 text-sm font-semibold">Fixflow Connector</h3>
              <p className="mb-4 text-xs text-muted-foreground">Install on the PC or Mac running Tally.</p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => WIN_URL ? triggerDownload(WIN_URL, "FixflowConnector.exe") : toast.info("Windows installer coming soon", { duration: 4000 })}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="flex-1 text-left">Windows (.exe)</span>
                  {WIN_URL ? <ExternalLink className="h-3.5 w-3.5 opacity-70" /> : (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-2xs">Soon</span>
                  )}
                </button>

                <button
                  onClick={() => MAC_URL ? triggerDownload(MAC_URL, "FixflowConnector.dmg") : toast.info("macOS installer coming soon", { duration: 4000 })}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary/80 active:scale-95"
                >
                  <Apple className="h-4 w-4" />
                  <span className="flex-1 text-left">macOS (.dmg)</span>
                  {MAC_URL ? <ExternalLink className="h-3.5 w-3.5 opacity-50" /> : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-2xs text-muted-foreground">Soon</span>
                  )}
                </button>
              </div>

              <p className="mt-3 text-2xs text-muted-foreground">v1.0.0 · macOS 12+ / Windows 10+ · ~15 MB</p>
            </motion.div>

            {/* Connection status card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <h3 className="mb-4 text-sm font-semibold">Connection Status</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Connector installed", done: paired || !!syncedCompany },
                  { label: "Pairing successful", done: paired || !!syncedCompany },
                  { label: "Initial sync complete", done: !!syncedCompany },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                      item.done ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-secondary",
                    )}>
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>
                    <span className={cn("text-xs", item.done ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Info note */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/50 dark:bg-amber-500/8"
            >
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Install the connector on the same machine as Tally. It syncs data in the background — Tally keeps running normally.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
