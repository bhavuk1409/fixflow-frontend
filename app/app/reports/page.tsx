"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, RefreshCw, Clock, CheckCircle2, XCircle, Loader2, Mail,
  FileBarChart2, ReceiptIndianRupee, TrendingUp,
  Calendar, Plus, Trash2, ArrowUpRight, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useAppState } from "@/lib/store";
import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/utils";
import { Topbar } from "@/components/layout/Topbar";
import { NoReportsEmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/api";

function CashflowPremiumIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3.5 17.5h17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5.2 14.2c1.4-1.8 2.7-1.8 4.1 0 1.4 1.8 2.7 1.8 4.1 0 1.4-1.8 2.7-1.8 4.1 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M15.8 8.2h4.2v4.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 8.2 13.4 14.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function DeliveryPremiumIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 13.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 8.5v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m12 8.5 2.3 2.3M12 8.5 9.7 10.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m12 18.5 2.3-2.3M12 18.5 9.7 16.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── Report types config ───────────────────────────────────────────────────────
const REPORT_TYPES = [
  { id: "weekly",   label: "Weekly Summary", desc: "P&L, cashflow & highlights",  icon: FileBarChart2    },
  { id: "pnl",      label: "Profit & Loss",  desc: "Detailed income & expense",   icon: TrendingUp       },
  { id: "cashflow", label: "Cash Flow",      desc: "Inflows, outflows, net",      icon: CashflowPremiumIcon },
  { id: "gst",      label: "GST Summary",    desc: "Tax liability overview",      icon: ReceiptIndianRupee },
];

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Report["status"] }) {
  const map = {
    queued:     { label: "Queued",     className: "bg-white/5 text-muted-foreground ring-1 ring-white/10", icon: Clock        },
    generating: { label: "Generating", className: "bg-primary/10 text-primary ring-1 ring-primary/20",     icon: Loader2      },
    done:       { label: "Completed",  className: "bg-white/5 text-foreground ring-1 ring-white/10",        icon: CheckCircle2 },
    failed:     { label: "Failed",     className: "bg-white/5 text-destructive ring-1 ring-destructive/20", icon: XCircle      },
  };
  const cfg = map[status] ?? map.queued;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
      cfg.className,
    )}>
      <Icon className={cn("h-3 w-3 flex-shrink-0", status === "generating" && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

// ── Report type icon chip ─────────────────────────────────────────────────────
function ReportTypeChip({ type }: { type: string }) {
  const normalizedType = (type || "weekly").toLowerCase();
  const cfg = REPORT_TYPES.find((r) => r.id === normalizedType) ?? REPORT_TYPES[0];
  const Icon = cfg.icon;
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary ring-1 ring-border">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

// ── Row skeleton ──────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/5 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3.5 w-36 rounded-md bg-white/5 animate-pulse" />
          <div className="h-3 w-24 rounded-md bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-20 rounded-full bg-white/5 animate-pulse" />
        <div className="h-7 w-24 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-7 w-7 rounded-lg bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { tenantId, companyId, fromIso, toIso } = useAppState();
  const api = useApi();
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState("weekly");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);

  const handleDownload = useCallback(async (report: Report) => {
    if (downloadingId) return;
    setDownloadingId(report.id);
    try {
      const res = await api.reports.download(report.tenant_id, report.company_id, report.id);
      const blob = new Blob([res.data as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixflow_${report.report_type}_${report.period_from}_${report.period_to}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }, [api, downloadingId]);

  const handleSendEmail = useCallback(async (report: Report) => {
    if (emailingId) return;
    setEmailingId(report.id);
    try {
      const res = await api.reports.sendEmail(report.tenant_id, report.company_id, report.id);
      toast.success(`Report emailed to ${res.data.to}`);
      qc.invalidateQueries({ queryKey: ["reports", tenantId, companyId] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send email.";
      toast.error(msg);
    } finally {
      setEmailingId(null);
    }
  }, [api, emailingId, qc, tenantId, companyId]);

  const deleteReport = useMutation({
    mutationFn: (report: Report) =>
      api.reports.delete(report.tenant_id, report.company_id, report.id),
    onSuccess: () => {
      toast.success("Report deleted.");
      qc.invalidateQueries({ queryKey: ["reports", tenantId, companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reports = useQuery({
    queryKey: ["reports", tenantId, companyId],
    queryFn: () => api.reports.list(tenantId, companyId).then((r) => r.data),
    enabled: !!companyId,
    refetchInterval: 15_000,
  });

  const generate = useMutation({
    mutationFn: (opts?: { reportType?: string; from?: string; to?: string } | void) => {
      return api.reports.generate(
        tenantId,
        companyId,
        opts?.from ?? fromIso,
        opts?.to ?? toIso,
        opts?.reportType ?? selectedType,
      ).then((r) => r.data);
    },
    onSuccess: () => {
      toast.success("Report queued — generating now.");
      qc.invalidateQueries({ queryKey: ["reports", tenantId, companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reportList: Report[] = reports.data?.reports ?? [];
  const hasReports = reportList.length > 0;

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Reports" />

      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col space-y-7 px-6 py-6 pb-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Financial Reports</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground pl-[42px]">
              Auto-generated every Monday, or generate on demand and download as PDF.
            </p>
          </div>
          <button
            onClick={() => generate.mutate(undefined)}
            disabled={generate.isPending || !companyId}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50",
              "bg-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.3)] hover:bg-blue-400 hover:shadow-[0_0_32px_rgba(59,130,246,0.45)]",
            )}
          >
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate Report
          </button>
        </motion.div>

        {/* ── Report type cards ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {REPORT_TYPES.map((rt, i) => {
            const Icon = rt.icon;
            const active = selectedType === rt.id;
            return (
              <motion.button
                key={rt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.05 }}
                onClick={() => setSelectedType(rt.id)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                  active
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                    : "border-border bg-card hover:border-border hover:bg-secondary/40",
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition-colors",
                    active
                      ? "bg-primary/10 ring-primary/20"
                      : "bg-secondary ring-border",
                  )}>
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  {active && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                    {rt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rt.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Email notice banner ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-border">
            <DeliveryPremiumIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Want reports delivered automatically?{" "}
            <a
              href="/app/settings"
              className="inline-flex items-center gap-0.5 font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              Add a recipient in Settings
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </motion.div>

        {/* ── Report history ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          {/* Table header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-semibold text-foreground">Report History</h3>
              {reports.data?.total != null && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-white/10">
                  {reports.data.total}
                </span>
              )}
            </div>
            <button
              onClick={() => reports.refetch()}
              disabled={reports.isFetching}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", reports.isFetching && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Column labels */}
          {hasReports && (
            <div className="hidden sm:grid sm:grid-cols-[1fr_140px_140px_auto] border-b border-border/50 px-5 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Report</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Period</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Actions</span>
            </div>
          )}

          {/* Rows */}
          {reports.isLoading ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : !hasReports ? (
            <div className="p-8">
              <NoReportsEmptyState onGenerate={() => generate.mutate(undefined)} />
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence initial={false}>
                {reportList.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ delay: i * 0.03 }}
                    className="group grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_140px_140px_auto] sm:items-center"
                  >
                    {(() => {
                      const normalizedType = (report.report_type || "weekly").toLowerCase();
                      const typeCfg = REPORT_TYPES.find((r) => r.id === normalizedType) ?? REPORT_TYPES[0];
                      const reportLabel = typeCfg.label;
                      return (
                        <>
                    {/* Report name + date */}
                    <div className="flex items-center gap-3">
                      <ReportTypeChip type={report.report_type} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold capitalize text-foreground truncate">
                          {reportLabel}
                        </p>
                        {report.email_sent_at && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                            <Mail className="h-3 w-3" />
                            Emailed {formatDate(report.email_sent_at)}
                          </span>
                        )}
                        {report.error && (
                          <p className="mt-0.5 text-[11px] text-red-400 truncate">{report.error}</p>
                        )}
                      </div>
                    </div>

                    {/* Period */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
                      <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <span>{formatDate(report.period_from)} – {formatDate(report.period_to)}</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <StatusBadge status={report.status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {report.status === "done" && report.has_pdf && (
                        <>
                          {/* Send email */}
                          <button
                            onClick={() => handleSendEmail(report)}
                            disabled={!!emailingId}
                            title="Send by email"
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all",
                              "hover:bg-secondary hover:text-foreground",
                              "disabled:opacity-40",
                            )}
                          >
                            {emailingId === report.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {/* Download */}
                          <button
                            onClick={() => handleDownload(report)}
                            disabled={downloadingId === report.id}
                            title="Download PDF"
                            className={cn(
                              "flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-all",
                              "hover:bg-secondary hover:text-foreground",
                              "disabled:opacity-40",
                            )}
                          >
                            {downloadingId === report.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            PDF
                          </button>
                        </>
                      )}
                      {report.status === "done" && !report.has_pdf && (
                        <button
                          onClick={() => generate.mutate({
                            reportType: normalizedType,
                            from: report.period_from,
                            to: report.period_to,
                          })}
                          disabled={generate.isPending}
                          title="PDF missing — regenerate"
                          className={cn(
                            "flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-xs font-medium text-muted-foreground transition-all",
                            "hover:text-foreground disabled:opacity-40",
                          )}
                        >
                          {generate.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Regenerate
                        </button>
                      )}
                      {/* Created at */}
                      {report.created_at && (() => {
                        const d = new Date(report.created_at);
                        return isNaN(d.getTime()) ? null : (
                          <span className="hidden text-[11px] text-muted-foreground/50 sm:block whitespace-nowrap">
                            {format(d, "dd MMM, HH:mm")}
                          </span>
                        );
                      })()}
                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm("Delete this report? This cannot be undone.")) {
                            deleteReport.mutate(report);
                          }
                        }}
                        disabled={deleteReport.isPending}
                        title="Delete report"
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground/30 transition-all",
                          "hover:border-border hover:bg-secondary hover:text-destructive",
                          "disabled:opacity-40",
                        )}
                      >
                        {deleteReport.isPending && deleteReport.variables?.id === report.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                        </>
                      );
                    })()}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
