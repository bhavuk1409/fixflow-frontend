"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Home,
  Menu,
  PlugZap,
  CreditCard,
  Settings2,
  X,
} from "lucide-react";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { AICfoLogo } from "@/components/ui/ai-cfo-logo";

function FixflowLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6 L26 6 Q38 6 38 18 Q38 26 28 28 L14 28 L22 20 L28 20 Q30 20 30 18 Q30 16 28 16 L2 16 Z" fill="currentColor" />
      <path d="M12 32 L30 32 Q38 32 38 26 L38 30 Q38 38 28 38 L10 38 Z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

const mainNavItems = [
  { href: "/app/dashboard", icon: Home, label: "Dashboard" },
  { href: "/app/connect", icon: PlugZap, label: "Connect" },
  { href: "/app/reports", icon: FileText, label: "Reports" },
  { href: "/app/ask", icon: Home, label: "AI CFO" },
];

const bottomNavItems = [
  { href: "/pricing", icon: CreditCard, label: "Billing" },
  { href: "/app/settings", icon: Settings2, label: "Settings" },
];
const navItems = [...mainNavItems, ...bottomNavItems];

function RailLink({
  href,
  icon: Icon,
  label,
  active,
  expanded,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  expanded: boolean;
}) {
  const isAICfo = label === "AI CFO";

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-12 items-center rounded-xl border px-3 transition-all duration-200",
        expanded ? "justify-start gap-3" : "justify-center",
        active
          ? "border-primary/40 bg-primary/12 text-foreground shadow-[0_0_18px_rgba(59,130,246,0.18)]"
          : "border-transparent text-slate-400 hover:border-primary/25 hover:bg-primary/5 hover:text-blue-300",
      )}
      title={label}
    >
      {isAICfo ? <AICfoLogo tone={active ? "active" : "default"} /> : <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors duration-200", active ? "text-foreground" : "text-slate-400 group-hover:text-blue-300")} strokeWidth={2} />}
      {expanded && (
        <span
          className={cn(
            "truncate text-sm font-medium transition-colors duration-200",
            isAICfo
              ? (active ? "text-blue-100" : "text-slate-300 group-hover:text-blue-200")
              : (active ? "text-foreground" : "text-slate-400 group-hover:text-blue-300"),
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { user } = useUser();
  const accountName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  return (
    <aside
      className={cn(
        "relative flex h-full flex-shrink-0 flex-col border-r border-border bg-[hsl(var(--sidebar-bg))] py-3 transition-[width] duration-200",
        expanded ? "w-56" : "w-[72px]",
        className,
      )}
    >
      <div className="flex justify-center pb-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Fixflow"
          className={cn(
            "flex h-11 items-center rounded-2xl border border-border bg-secondary text-primary transition",
            expanded ? "w-[calc(100%-20px)] justify-start gap-2 px-3" : "w-11 justify-center",
          )}
        >
          <FixflowLogo size={20} />
          {expanded && <span className="text-sm font-semibold text-foreground">Fixflow</span>}
        </button>
      </div>

      <nav className="flex flex-col gap-1.5 px-2.5">
        {mainNavItems.map((item) => (
          <RailLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
            expanded={expanded}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-1.5 px-2.5">
        {bottomNavItems.map((item) => (
          <RailLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
            expanded={expanded}
          />
        ))}
        {expanded ? (
          <div className="flex items-center gap-2 px-2 pt-1.5">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8 rounded-lg" } }} />
            <p className="truncate text-sm font-medium text-foreground" title={accountName}>
              {accountName}
            </p>
          </div>
        ) : (
          <div className="flex justify-center pt-1.5">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8 rounded-lg" } }} />
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-[hsl(var(--sidebar-bg))] p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <FixflowLogo size={18} />
                  <span className="text-[13px] font-semibold text-foreground">Fixflow</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const isAICfo = item.label === "AI CFO";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition duration-200",
                        active
                          ? "border-primary/40 bg-primary/12 text-foreground"
                          : "border-transparent text-slate-400 hover:border-primary/25 hover:bg-primary/5 hover:text-blue-300",
                      )}
                    >
                      {isAICfo ? <AICfoLogo tone={active ? "active" : "default"} /> : <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors duration-200", active ? "text-foreground" : "text-slate-400 group-hover:text-blue-300")} strokeWidth={2} />}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
