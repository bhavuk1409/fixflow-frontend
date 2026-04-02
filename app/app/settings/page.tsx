"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Plus, Trash2, Loader2, Save, Wifi,
  Bell, Palette, Moon, Sun, Monitor,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { useApi } from "@/lib/useApi";
import { Topbar } from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { recipientEmailSchema, companyIdSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// ── Settings nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "appearance", label: "Appearance",     icon: Palette   },
  { id: "company",    label: "Company",        icon: Building2 },
  { id: "reports",    label: "Report Email",   icon: Mail      },
  { id: "notifs",     label: "Notifications",  icon: Bell      },
];

// ── Section card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, description, icon: Icon, children }: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-start gap-3 border-b border-border px-6 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Theme selector ────────────────────────────────────────────────────────────
function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light",  label: "Light",  Icon: Sun     },
    { id: "dark",   label: "Dark",   Icon: Moon    },
    { id: "system", label: "System", Icon: Monitor },
  ];
  return (
    <div className="flex gap-2">
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all",
            theme === id
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-secondary text-muted-foreground hover:border-primary/20 hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Reusable toggle switch ────────────────────────────────────────────────────
function Toggle({ enabled, onToggle, loading }: { enabled: boolean; onToggle: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={loading}
      className={cn(
        "relative flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 disabled:opacity-60",
        enabled
          ? "border-primary bg-primary"
          : "border-border bg-secondary",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          enabled ? "translate-x-[22px]" : "translate-x-[2px]",
          loading && "animate-pulse",
        )}
      />
    </button>
  );
}

// ── Notifications section ─────────────────────────────────────────────────────
function NotificationsSection({
  tenantId,
  settings,
  saveSettings,
}: {
  tenantId: string;
  settings: any;
  saveSettings: { mutate: (patch: Record<string, unknown>) => void; isPending: boolean };
}) {
  const api = useApi();

  // "Weekly report ready" is backed by settings.reports_enabled (persisted to backend).
  const weeklyEnabled: boolean = settings?.reports_enabled ?? true;

  // "Sync errors" and "Cash balance alerts" are stored locally per-tenant
  const syncKey  = `fixflow_notif_sync_${tenantId}`;
  const cashKey  = `fixflow_notif_cash_${tenantId}`;

  const [syncErrors, setSyncErrors] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const v = localStorage.getItem(syncKey);
    return v === null ? false : v === "true";
  });
  const [cashAlerts, setCashAlerts] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const v = localStorage.getItem(cashKey);
    return v === null ? false : v === "true";
  });

  // Track last-seen error so we don't spam the same toast
  const lastErrorRef = useRef<string | null>(null);

  // Poll connector status every 30 s when sync error alerts are enabled
  useQuery({
    queryKey: ["connector-status", tenantId],
    queryFn: () => api.connector.status(tenantId).then((r) => r.data),
    enabled: syncErrors,
    refetchInterval: 30_000,
    staleTime: 0,
    select: (data) => {
      if (data.status === "error" && data.error_message) {
        // Only toast once per unique error message
        if (lastErrorRef.current !== data.error_message) {
          lastErrorRef.current = data.error_message;
          const ago = data.last_seen_at
            ? (() => {
                const secs = Math.floor((Date.now() - new Date(data.last_seen_at).getTime()) / 1000);
                if (secs < 60) return `${secs}s ago`;
                if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
                return `${Math.floor(secs / 3600)}h ago`;
              })()
            : "";
          toast.error(
            `Sync error${ago ? ` (${ago})` : ""}: ${data.error_message}`,
            { duration: 8000, id: "connector-sync-error" },
          );
        }
      } else if (data.status === "ok") {
        // Clear the last error so next error is fresh
        lastErrorRef.current = null;
      }
      return data;
    },
  });

  const toggleWeekly = () => {
    saveSettings.mutate({ reports_enabled: !weeklyEnabled });
  };

  const toggleSync = () => {
    const next = !syncErrors;
    setSyncErrors(next);
    localStorage.setItem(syncKey, String(next));
    toast.success(next ? "Sync error alerts enabled." : "Sync error alerts disabled.");
  };

  const toggleCash = () => {
    const next = !cashAlerts;
    setCashAlerts(next);
    localStorage.setItem(cashKey, String(next));
    toast.success(next ? "Cash balance alerts enabled." : "Cash balance alerts disabled.");
  };

  const items = [
    {
      label: "Weekly report ready",
      sub: "In-app alert when your Monday report finishes generating",
      enabled: weeklyEnabled,
      onToggle: toggleWeekly,
      loading: saveSettings.isPending,
    },
    {
      label: "Sync errors",
      sub: "Alert when Tally sync fails or connector goes offline",
      enabled: syncErrors,
      onToggle: toggleSync,
      loading: false,
    },
    {
      label: "Cash balance alerts",
      sub: "Notify when cashflow drops below a threshold",
      enabled: cashAlerts,
      onToggle: toggleCash,
      loading: false,
    },
  ];

  return (
    <SectionCard icon={Bell} title="Notifications" description="Control what you get notified about">
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.label} className={cn("flex items-center justify-between gap-4", i > 0 && "border-t border-border pt-4")}>
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
            <Toggle enabled={item.enabled} onToggle={item.onToggle} loading={item.loading} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Main settings page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { tenantId, companyId, setCompanyId } = useAppState();
  const api = useApi();
  const qc = useQueryClient();

  const [activeSection, setActiveSection] = useState("appearance");
  const [companyInput, setCompanyInput] = useState(companyId);
  const [emailInput, setEmailInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);

  const settings = useQuery({
    queryKey: ["settings", tenantId],
    queryFn: () => api.settings.get(tenantId).then((r) => r.data as any),
  });

  useEffect(() => {
    if (settings.data?.report_email) {
      setRecipients(
        settings.data.report_email
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean)
      );
    }
  }, [settings.data]);

  const saveSettings = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.settings.patch(tenantId, patch),
    onSuccess: () => {
      toast.success("Settings saved.");
      qc.invalidateQueries({ queryKey: ["settings", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSaveCompany = () => {
    const res = companyIdSchema.safeParse(companyInput.trim());
    if (!res.success) { toast.error("Invalid company ID — must be a UUID."); return; }
    setCompanyId(companyInput.trim());
    toast.success("Company ID saved.");
  };

  const handleAddRecipient = () => {
    const res = recipientEmailSchema.safeParse(emailInput.trim());
    if (!res.success) { toast.error("Invalid email address."); return; }
    if (recipients.includes(emailInput.trim())) { toast.error("Email already added."); return; }
    const updated = [...recipients, emailInput.trim()];
    setRecipients(updated);
    setEmailInput("");
    saveSettings.mutate({ report_email: updated.join(", ") });
  };

  const handleRemoveRecipient = (email: string) => {
    const updated = recipients.filter((r) => r !== email);
    setRecipients(updated);
    saveSettings.mutate({ report_email: updated.length > 0 ? updated.join(", ") : null });
  };

  return (
    <div className="flex flex-col">
      <Topbar title="Settings" />

      <div className="flex min-h-0 flex-1">
        {/* ── Settings nav sidebar ─────────────────────────────────────── */}
        <nav className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-5 lg:block">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Settings
          </p>
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-left transition-all",
                  activeSection === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Settings content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-5">

            <AnimatePresence mode="wait">

              {activeSection === "appearance" && (
                <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SectionCard icon={Palette} title="Appearance" description="Customize the look and feel">
                    <ThemeSelector />
                  </SectionCard>
                </motion.div>
              )}

              {activeSection === "company" && (
                <motion.div key="company" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SectionCard icon={Building2} title="Company" description="Your Tally company configuration">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="tenant-id">
                          Tenant ID
                        </label>
                        <Input
                          id="tenant-id"
                          value={tenantId}
                          readOnly
                          className="bg-secondary text-xs font-mono text-muted-foreground cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Your unique tenant identifier (read-only).</p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="company-id">
                          Company UUID
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="company-id"
                            value={companyInput}
                            onChange={(e) => setCompanyInput(e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="font-mono text-xs"
                          />
                          <button
                            onClick={handleSaveCompany}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95"
                          >
                            <Save className="h-3.5 w-3.5" /> Save
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          UUID of the company to display data for. Find it in sync logs or{" "}
                          <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-xs">GET /health</code>.
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {activeSection === "reports" && (
                <motion.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SectionCard icon={Mail} title="Report Recipients" description="Receive weekly reports by email">
                    <div className="space-y-4">
                      {/* ── Auto-weekly report toggle ── */}
                      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Send weekly report automatically</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Every Monday morning a fresh summary is emailed to the recipient below
                          </p>
                        </div>
                        <Toggle
                          enabled={settings.data?.reports_enabled ?? true}
                          onToggle={() =>
                            saveSettings.mutate({ reports_enabled: !(settings.data?.reports_enabled ?? true) })
                          }
                          loading={saveSettings.isPending}
                        />
                      </div>

                      {/* ── Recipient email ── */}
                      <div className="flex gap-2">
                        <Input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="name@company.com"
                          type="email"
                          onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
                          className="text-sm"
                        />
                        <button
                          onClick={handleAddRecipient}
                          disabled={saveSettings.isPending}
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                        >
                          {saveSettings.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          Add
                        </button>
                      </div>
                      {recipients.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recipients yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {recipients.map((email) => (
                            <div key={email} className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                                  <Mail className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-sm font-medium">{email}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveRecipient(email)}
                                className="rounded-lg p-1 text-muted-foreground/60 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {activeSection === "notifs" && (
                <motion.div key="notifs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <NotificationsSection tenantId={tenantId} settings={settings.data} saveSettings={saveSettings} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
