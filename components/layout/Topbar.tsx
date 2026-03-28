"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, CalendarDays, ChevronDown, Moon, Sun, X } from "lucide-react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { useAppState } from "@/lib/store";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "./Sidebar";

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: 365 },
];

const DEFAULT_NOTIFICATIONS = [
  { id: "n1", title: "Weekly report ready", subtitle: "Your latest report is available in Reports." },
  { id: "n2", title: "Connector synced", subtitle: "Tally data synced successfully." },
  { id: "n3", title: "AI CFO update", subtitle: "Improved response reliability is now live." },
];

export function Topbar({ title }: { title?: string }) {
  const { tenantId, dateRange, setDateRange } = useAppState();
  const api = useApi();

  const [showPicker, setShowPicker] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [hasUnread, setHasUnread] = useState(true);
  const { theme, setTheme } = useTheme();

  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const from = dateRange.from instanceof Date ? dateRange.from : new Date(dateRange.from);
  const to = dateRange.to instanceof Date ? dateRange.to : new Date(dateRange.to);
  const isCustomActive = !PRESETS.some((preset) => {
    const nextTo = new Date();
    const nextFrom = new Date();
    nextFrom.setDate(nextTo.getDate() - preset.days);
    return format(from, "yyyy-MM-dd") === format(nextFrom, "yyyy-MM-dd");
  });

  useEffect(() => {
    let cancelled = false;
    const loadDismissed = async () => {
      try {
        const res = await api.settings.get(tenantId);
        const rawIds = (res.data as { dismissed_notification_ids?: unknown }).dismissed_notification_ids;
        const dismissedIds = new Set(Array.isArray(rawIds) ? rawIds.filter((id): id is string => typeof id === "string") : []);
        if (cancelled) return;
        setNotifications(DEFAULT_NOTIFICATIONS.filter((item) => !dismissedIds.has(item.id)));
      } catch {
        // non-fatal
      }
    };
    void loadDismissed();
    return () => {
      cancelled = true;
    };
  }, [api, tenantId]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const persistDismissed = (nextNotifications: typeof DEFAULT_NOTIFICATIONS) => {
    const visible = new Set(nextNotifications.map((i) => i.id));
    const dismissedIds = DEFAULT_NOTIFICATIONS.filter((i) => !visible.has(i.id)).map((i) => i.id);
    void api.settings.patch(tenantId, { dismissed_notification_ids: dismissedIds }).catch(() => {
      // non-fatal
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[hsl(var(--topbar-bg))]/85 px-4 py-2.5 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          {title && <h1 className="text-sm font-semibold tracking-tight text-foreground md:text-[15px]">{title}</h1>}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setShowPicker((p) => {
                  const next = !p;
                  if (next) {
                    setShowCustomRange(false);
                    setCustomFrom(format(from, "yyyy-MM-dd"));
                    setCustomTo(format(to, "yyyy-MM-dd"));
                  }
                  return next;
                });
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                showPicker && "border-primary/30 bg-primary/10 text-foreground",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">{format(from, "dd MMM")} – {format(to, "dd MMM yyyy")}</span>
              <span className="sm:hidden">{format(from, "MMM d")} – {format(to, "MMM d")}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", showPicker && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-card-hover dark:shadow-card-dark-hover"
                >
                  <div className="p-1.5">
                    {PRESETS.map((preset) => {
                      const nextTo = new Date();
                      const nextFrom = new Date();
                      nextFrom.setDate(nextTo.getDate() - preset.days);
                      const active = format(from, "yyyy-MM-dd") === format(nextFrom, "yyyy-MM-dd");
                      return (
                        <button
                          key={preset.label}
                          onClick={() => {
                            setDateRange({ from: nextFrom, to: nextTo });
                            setShowCustomRange(false);
                            setShowPicker(false);
                          }}
                          className={cn(
                            "w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                            active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          {preset.label}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setShowCustomRange((v) => !v);
                        setCustomFrom(format(from, "yyyy-MM-dd"));
                        setCustomTo(format(to, "yyyy-MM-dd"));
                      }}
                      className={cn(
                        "mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                        isCustomActive || showCustomRange
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      Custom
                    </button>

                    {showCustomRange && (
                      <div className="mt-2 space-y-2 rounded-lg border border-border bg-secondary/40 p-2.5">
                        <div className="space-y-1">
                          <label className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">From</label>
                          <input
                            type="date"
                            value={customFrom}
                            max={customTo || undefined}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:border-primary/40"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">To</label>
                          <input
                            type="date"
                            value={customTo}
                            min={customFrom || undefined}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:border-primary/40"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (!customFrom || !customTo) return;
                            const nextFrom = new Date(`${customFrom}T12:00:00`);
                            const nextTo = new Date(`${customTo}T12:00:00`);
                            setDateRange({ from: nextFrom, to: nextTo });
                            setShowCustomRange(false);
                            setShowPicker(false);
                          }}
                          disabled={!customFrom || !customTo}
                          className="mt-1 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply custom range
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                setHasUnread(false);
              }}
              className="relative rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-3.5 w-3.5" />
              {hasUnread && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-card-hover dark:shadow-card-dark-hover"
                >
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">Notifications</p>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          persistDismissed([]);
                        }}
                        className="text-[11px] text-muted-foreground transition hover:text-foreground"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {notifications.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</p>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="group flex gap-2.5 rounded-lg px-2.5 py-2 hover:bg-secondary">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">{item.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{item.subtitle}</p>
                          </div>
                          <button
                            onClick={() => {
                              const next = notifications.filter((n) => n.id !== item.id);
                              setNotifications(next);
                              persistDismissed(next);
                            }}
                            className="mt-0.5 rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-secondary hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            <Sun className="h-3.5 w-3.5 dark:hidden" />
            <Moon className="hidden h-3.5 w-3.5 dark:block" />
          </button>

          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8 rounded-full border border-border" } }} />
        </div>
      </div>
    </header>
  );
}
