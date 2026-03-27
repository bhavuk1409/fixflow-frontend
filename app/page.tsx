"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, FileText, Zap, Check,
  Shield, Globe, Sparkles, TrendingUp, Database,
} from "lucide-react";
import HeroArcs from "@/components/landing/HeroArcs";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function FixflowMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top swoosh — wide left, tapers to point right */}
      <path d="M2 6 L26 6 Q38 6 38 18 Q38 26 28 28 L14 28 L22 20 L28 20 Q30 20 30 18 Q30 16 28 16 L2 16 Z" fill="currentColor" />
      {/* Bottom tick — small, offset right */}
      <path d="M12 32 L30 32 Q38 32 38 26 L38 30 Q38 38 28 38 L10 38 Z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ── Landing Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a1a0f", color: "#e8f5e9" }}>

      {/* ── ANNOUNCEMENT BAR ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b px-4 py-2.5 text-center text-[12px] font-medium" style={{ borderColor: "rgba(74,222,128,0.15)", background: "rgba(0,0,0,0.3)" }}>
        <span style={{ color: "#9ba7a0" }}>Introducing Fixflow - AI Business Analyst built for Tally users across India.</span>
        <Link href="/sign-up" className="font-semibold underline underline-offset-2 transition hover:no-underline" style={{ color: "#4ade80" }}>
          Get early access
        </Link>
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(10,26,15,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="mx-auto flex min-h-[64px] w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:h-[60px] sm:flex-nowrap sm:gap-0 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div style={{ color: "#4ade80" }}>
              <FixflowMark size={26} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">Fixflow</span>
          </Link>

          <div className="hidden items-center gap-1 text-[13px] font-medium md:flex" style={{ color: "#8fa88f" }}>
            {[
              { label: "Features", hasArrow: false, href: "#features" },
              { label: "Pricing", hasArrow: false, href: "#pricing" },
              { label: "Connect Tally", hasArrow: false, href: "/sign-up" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-0.5 rounded-lg px-3 py-1.5 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border px-3 py-1.5 text-[12px] font-medium text-white transition hover:border-white/30 sm:px-4 sm:text-[13px]"
              style={{ borderColor: "rgba(255,255,255,0.18)", background: "transparent" }}
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold text-black transition hover:opacity-90 sm:px-4 sm:text-[13px]"
              style={{ background: "#4ade80" }}
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "calc(100vh - 100px)" }}>
        {/* Staged arc/ribbon animation — right side */}
        <div className="hidden sm:block">
          <HeroArcs />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-7xl items-center px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="max-w-[600px]"
          >
            <motion.h1
              variants={fadeUp}
              className="text-[38px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[60px] lg:text-[68px]"
            >
              Your Tally data,<br />
              <span style={{ color: "#4ade80" }}>instantly</span><br />
              understood.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[480px] text-[16px] leading-relaxed"
              style={{ color: "#8fa88f" }}
            >
              Fixflow is the AI Business Analyst for Indian SMEs on Tally. Ask business questions
              in plain English — get accurate, data-backed answers from your own books.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/sign-up"
                className="group flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold text-black transition hover:opacity-90"
                style={{ background: "#4ade80" }}
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#features"
                className="rounded-full border px-6 py-3 text-center text-[14px] font-medium text-white transition hover:border-white/30"
                style={{ borderColor: "rgba(255,255,255,0.18)" }}
              >
                See how it works
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-5 text-[12px]"
              style={{ color: "#6b8a6b" }}
            >
              {["No credit card", "Tally Prime & ERP 9", "Read-only & secure", "5-min setup"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3" style={{ color: "#4ade80" }} />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── LOGO / INTEGRATION STRIP ────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-y py-10"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-7 text-center text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#4a6a4a" }}>
            Works with your Tally setup
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-[15px] font-semibold" style={{ color: "#3a5a3a" }}>
            {["Tally Prime", "Tally ERP 9", "GST Portal", "Multi-company", "CA Firms"].map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="transition hover:text-white/60"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3 sm:gap-8">
            {[
              { num: "2 min", label: "To connect", sub: "One-click Tally setup, no IT needed" },
              { num: "100%", label: "SQL-verified", sub: "Every answer is deterministic, not guessed" },
              { num: "₹0", label: "To start", sub: "Free plan, no card required" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <p className="text-[46px] font-extrabold leading-none tracking-tight sm:text-[52px]" style={{ color: "#4ade80" }}>
                  {stat.num}
                </p>
                <p className="mt-2 text-[15px] font-semibold text-white">{stat.label}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: "#6b8a6b" }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-12 text-center"
          >
            <motion.div variants={fadeUp} className="mb-4 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
              Core Capabilities
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-[32px] font-extrabold tracking-tight text-white sm:text-[44px]">
              From accounting records
              <br className="hidden sm:block" />
              to business intelligence
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-[15px]" style={{ color: "#8fa88f" }}>
              Fixflow connects to Tally in one click and turns your books into clear, actionable answers.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2"
          >
            {[
              {
                icon: Brain,
                title: "AI Business Analyst",
                desc: "Ask business questions in plain English. 'Why are profits falling?' 'Which customers hurt my margins?' Get answers backed by your actual Tally data — not guesses.",
                highlight: "NL→SQL",
                highlightLabel: "verified answers",
              },
              {
                icon: TrendingUp,
                title: "Sales, P&L & Cashflow",
                desc: "Live income, expense, net profit, and cashflow analysis. Trend detection across months, quarters, and years — all pulled directly from your Tally ledgers.",
                highlight: "MoM / YoY",
                highlightLabel: "trend analysis",
              },
              {
                icon: FileText,
                title: "GST & Compliance Insights",
                desc: "Instant GST summaries, tax liability breakdown, and compliance readiness — calculated from your purchase and sales vouchers with full auditability.",
                highlight: "GST-ready",
                highlightLabel: "for Indian SMEs",
              },
              {
                icon: Zap,
                title: "Inventory & Anomaly Detection",
                desc: "Identify dead stock, slow-moving items, and unusual patterns in your data. Risk signals and anomaly alerts surfaced automatically before they become problems.",
                highlight: "Auto",
                highlightLabel: "anomaly alerts",
              },
            ].map((feat) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                className="group relative rounded-2xl border p-6 transition-all hover:border-[rgba(74,222,128,0.2)]"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(74,222,128,0.12)" }}>
                  <feat.icon className="h-5 w-5" style={{ color: "#4ade80" }} />
                </div>
                <h3 className="text-[17px] font-bold text-white">{feat.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#8fa88f" }}>{feat.desc}</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-extrabold" style={{ color: "#4ade80" }}>{feat.highlight}</span>
                  <span className="text-[12px]" style={{ color: "#6b8a6b" }}>{feat.highlightLabel}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ENTERPRISE SECTION (light bg) ────────────────────────────────── */}
      <section className="py-20" style={{ background: "#f0f4f0" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "rgba(34,197,94,0.4)", color: "#16a34a", background: "rgba(34,197,94,0.08)" }}>
              Security & Trust
            </div>
            <h2 className="text-[32px] font-extrabold tracking-tight sm:text-[44px]" style={{ color: "#0f2810" }}>
              Built for finance teams
              <br className="hidden sm:block" />
              that need to trust their data
            </h2>
            <p className="mt-3 text-[15px]" style={{ color: "#4a6a4a" }}>
              Trust is a first-class product feature. Every answer is auditable, every query is logged, and your books
              are never modified.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Shield, title: "Read-only. Always.", desc: "Fixflow never writes to your Tally. It only reads. Your books are your books — we never touch them." },
              { icon: Database, title: "Deterministic Answers", desc: "Every numerical answer comes from a verified SQL query on your data. No hallucinations. No approximations. Full audit trail." },
              { icon: Globe, title: "Data Stays in India", desc: "All data stored on Indian infrastructure. DPDP compliant. Encrypted in transit and at rest. Multi-company support with role-based access." },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border p-5"
                style={{ borderColor: "rgba(34,197,94,0.15)", background: "white" }}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "rgba(34,197,94,0.1)" }}>
                  <feat.icon className="h-4.5 w-4.5" style={{ color: "#16a34a" }} />
                </div>
                <h3 className="text-[15px] font-bold" style={{ color: "#0f2810" }}>{feat.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "#4a6a4a" }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-4 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
              Pricing
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-[32px] font-extrabold tracking-tight text-white sm:text-[36px]">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 text-[14px]" style={{ color: "#8fa88f" }}>
              Start free. No card required. Upgrade when you scale.
            </motion.p>

            <motion.div variants={stagger} className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  name: "Starter", price: "Free", period: "forever",
                  features: [
                    "Perfect for getting started",
                    "No credit card required",
                    "1 Tally company",
                    "Live P&L & cashflow",
                    "Basic receivables & payables",
                    "5 AI CFO queries / month",
                    "2 reports / month",
                    "Email support",
                  ],
                  cta: "Get started free", href: "/sign-up", highlight: false,
                },
                {
                  name: "Growth", price: "₹99", period: "/month",
                  features: [
                    "For growing businesses",
                    "Up to 5 Tally companies",
                    "Full financial intelligence suite",
                    "Unlimited AI CFO queries",
                    "Weekly automated reports",
                    "PDF download + email delivery",
                    "Receivables aging analysis",
                    "Payables management view",
                    "Priority support",
                  ],
                  cta: "Upgrade to Growth", href: "/pricing", highlight: true,
                },
              ].map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className="relative flex flex-col rounded-2xl border p-6 text-left"
                  style={{
                    borderColor: plan.highlight ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.06)",
                    background: plan.highlight ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold text-black" style={{ background: "#4ade80" }}>
                      Most popular
                    </div>
                  )}
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#6b8a6b" }}>{plan.name}</p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-[32px] font-extrabold tracking-tight text-white">{plan.price}</span>
                    {plan.period && <span className="mb-1.5 text-[13px]" style={{ color: "#6b8a6b" }}>{plan.period}</span>}
                  </div>
                  <ul className="mt-5 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: "#8fa88f" }}>
                        <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#4ade80" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className="mt-6 block rounded-full py-2.5 text-center text-[13px] font-bold transition"
                    style={plan.highlight
                      ? { background: "#4ade80", color: "#000" }
                      : { border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }
                    }
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        {/* Left-aligned layout like DeltaMemory CTA */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <motion.div variants={fadeUp} className="mb-3 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
                Early Access
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-[32px] font-extrabold leading-tight tracking-tight text-white sm:text-[52px]">
                Turn your Tally data into
                <br className="hidden sm:block" />
                <span style={{ color: "#4ade80" }}>decisions that compound.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-3 text-[15px]" style={{ color: "#8fa88f" }}>
                Fixflow is available to Tally businesses across India.
                <br className="hidden sm:block" />
                Connect in 2 minutes. Ask your first business question today.
              </motion.p>
            </div>
            <motion.div variants={fadeUp} className="flex-shrink-0">
              <Link
                href="/sign-up"
                className="group flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold text-black transition hover:opacity-90"
                style={{ background: "#4ade80" }}
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── GIANT WATERMARK SECTION ───────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "#060e08", height: "clamp(300px, 32vw, 440px)" }}>
        {/* Giant watermark text — fills full height */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          style={{
            fontSize: "clamp(100px, 22vw, 300px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "rgba(74,222,128,0.055)",
            userSelect: "none",
          }}
        >
          Fixflow
        </motion.div>

        {/* Centered CTA on top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#4ade80" }}>
            Start today — it&apos;s free
          </p>
          <Link
            href="/sign-up"
            className="group flex items-center gap-2 rounded-full px-8 py-4 text-[16px] font-bold text-black shadow-lg transition-all hover:opacity-90 hover:shadow-[0_0_50px_rgba(74,222,128,0.4)]"
            style={{ background: "#4ade80" }}
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t py-14" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5"
          >
            {/* Brand col */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div style={{ color: "#4ade80" }}><FixflowMark size={22} /></div>
                <span className="text-[14px] font-bold text-white">Fixflow</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "#4a6a4a" }}>
                The AI Business Analyst for Tally-powered Indian SMEs.
              </p>
            </motion.div>

            {/* Link columns */}
            {[
              {
                heading: "Product",
                links: [
                  { label: "AI Analyst", href: "/app/ask" },
                  { label: "P&L Dashboard", href: "/app/dashboard" },
                  { label: "GST Insights", href: "/app/reports" },
                  { label: "Connect Tally", href: "/app/connect" },
                ],
              },
              {
                heading: "Use Cases",
                links: [
                  { label: "Business Owners", href: "#features" },
                  { label: "Accountants", href: "#features" },
                  { label: "CA Firms", href: "#features" },
                  { label: "Wholesalers & Traders", href: "#features" },
                ],
              },
              {
                heading: "Company",
                links: [
                  { label: "About", href: "/about" },
                  { label: "Careers", href: "/careers" },
                  { label: "Blog", href: "/blog" },
                  { label: "Docs", href: "/docs" },
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                ],
              },
            ].map((col) => (
              <motion.div key={col.heading} variants={fadeUp}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#4a6a4a" }}>
                  {col.heading}
                </p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-[13px] transition hover:text-white" style={{ color: "#6b8a6b" }}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-[12px] sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "rgba(255,255,255,0.06)", color: "#4a6a4a" }}>
            <span>© 2026 Fixflow Technologies Pvt Ltd. AI Business Analyst for Tally SMEs.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
