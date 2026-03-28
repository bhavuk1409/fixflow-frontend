"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Cable, FileText, MessageSquare, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: Icon = Cable,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-border/70 bg-background text-center",
        variant === "default" ? "gap-5 px-8 py-24" : "gap-3 px-6 py-12",
        className,
      )}
    >
      {/* Icon */}
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" strokeWidth={2.1} />
        </div>
        <div className="pointer-events-none absolute -inset-2 rounded-[20px] border border-primary/15" />
        <div className="pointer-events-none absolute -inset-4 rounded-[24px] border border-primary/10" />
      </div>

      {/* Text */}
      <div className="max-w-[430px]">
        <h3 className={cn("font-semibold text-foreground", variant === "default" ? "text-2xl leading-snug" : "text-sm")}>
          {title}
        </h3>
        <p className={cn("mt-2 text-muted-foreground", variant === "default" ? "text-lg leading-relaxed" : "text-xs")}>
          {description}
        </p>
      </div>

      {/* Action */}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="group mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow-primary transition hover:opacity-90 active:scale-95"
          >
            {action.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="group mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow-primary transition hover:opacity-90 active:scale-95"
          >
            {action.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        )
      )}
    </motion.div>
  );
}

// Pre-configured empty states
export const ConnectTallyEmptyState = () => (
  <EmptyState
    icon={Cable}
    title="No financial data yet"
    description="Connect your Tally accounting software to start seeing live P&L, cashflow, and receivables."
    action={{ label: "Connect Tally", href: "/app/connect" }}
  />
);

export const NoReportsEmptyState = ({ onGenerate }: { onGenerate: () => void }) => (
  <EmptyState
    icon={FileText}
    title="No reports generated"
    description="Generate your first financial report — it'll be ready in a few minutes."
    action={{ label: "Generate Report", onClick: onGenerate }}
    variant="compact"
  />
);

export const NoChatHistoryEmptyState = () => (
  <EmptyState
    icon={MessageSquare}
    title="Ask your AI CFO anything"
    description="I have live access to your Tally data. Ask me about P&L, cashflow, receivables, or anything else."
    variant="compact"
  />
);
