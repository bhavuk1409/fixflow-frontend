"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a1a0f", color: "#e8f5e9" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "rgba(74,222,128,0.08)", background: "rgba(10,26,15,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="mx-auto flex h-[60px] max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-medium transition hover:text-white" style={{ color: "#8fa88f" }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Fixflow
          </Link>
          <span className="text-[14px] font-bold text-white">Privacy Policy</span>
          <Link href="/terms" className="text-[13px] font-medium transition hover:text-white" style={{ color: "#8fa88f" }}>
            Terms →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-12">
            <div className="mb-4 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
              Last updated: March 2026
            </div>
            <h1 className="text-[44px] font-extrabold tracking-tight text-white">Privacy Policy</h1>
            <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "#8fa88f" }}>
              At Fixflow, we take your privacy seriously. This policy explains how we collect, use, and protect your data.
            </p>
          </motion.div>

          {[
            {
              title: "1. Information We Collect",
              content: `We collect information you provide directly to us, such as your name, email address, and company details when you create an account. When you connect your Tally software, we receive read-only financial data including vouchers, ledger entries, party details, and transaction records. We do not store your Tally credentials.`,
            },
            {
              title: "2. How We Use Your Information",
              content: `We use your information to provide, maintain, and improve the Fixflow platform — including generating dashboards, financial summaries, AI-powered insights, and automated reports. We use your email to send product updates, alerts, and reports you have configured. We never sell your data to third parties.`,
            },
            {
              title: "3. Data Storage & Security",
              content: `All data is stored on Indian infrastructure hosted in AWS Mumbai (ap-south-1). Data is encrypted in transit using TLS 1.3 and at rest using AES-256. We maintain audit logs of all access. We are SOC 2 Type II compliant and adhere to India's Digital Personal Data Protection (DPDP) Act, 2023.`,
            },
            {
              title: "4. Tally Connector",
              content: `The Fixflow desktop connector is a read-only agent. It never modifies, deletes, or writes any data to your Tally installation. The connector syncs data over an encrypted channel and only runs when your Tally software is active. You can disconnect at any time from the Fixflow dashboard.`,
            },
            {
              title: "5. Data Retention",
              content: `We retain your financial data for as long as your account is active. On account deletion, all data is purged within 30 days. You can request an export of your data at any time by writing to support@fixflowtally.com.`,
            },
            {
              title: "6. Sharing & Disclosure",
              content: `We do not sell, rent, or share your personal or financial data with third parties for their marketing purposes. We may share data with trusted service providers (e.g., cloud infrastructure, email delivery) strictly to operate the platform. We may disclose data when required by law or a court order.`,
            },
            {
              title: "7. AI & Machine Learning",
              content: `The AI CFO feature uses your financial data to generate insights and answers. Queries may be processed by third-party LLM providers (currently OpenAI). We do not use your data to train shared models. All AI interactions are logged and available for audit in your account settings.`,
            },
            {
              title: "8. Your Rights",
              content: `Under the DPDP Act and applicable laws, you have the right to access, correct, and erase your personal data. You can export your data, withdraw consent, or delete your account at any time from Settings. For requests, email support@fixflowtally.com.`,
            },
            {
              title: "9. Cookies",
              content: `We use essential cookies to maintain your session and preferences. We use analytics cookies (anonymised) to understand feature usage and improve the product. You can disable non-essential cookies from your browser settings.`,
            },
            {
              title: "10. Contact Us",
              content: `For privacy-related questions or requests, contact our Data Protection Officer at support@fixflowtally.com. For general queries, reach us at info@fixflowtally.com.`,
            },
          ].map((section) => (
            <motion.div key={section.title} variants={fadeUp} className="mb-8">
              <h2 className="mb-3 text-[20px] font-bold text-white">{section.title}</h2>
              <p className="text-[15px] leading-[1.8]" style={{ color: "#8fa88f" }}>{section.content}</p>
            </motion.div>
          ))}

          <motion.div variants={fadeUp} className="mt-12 rounded-2xl border p-6" style={{ borderColor: "rgba(74,222,128,0.15)", background: "rgba(74,222,128,0.04)" }}>
            <p className="text-[13px]" style={{ color: "#6b8a6b" }}>
              Questions about this policy?{" "}
              <a href="mailto:support@fixflowtally.com" className="font-semibold transition hover:text-white" style={{ color: "#4ade80" }}>
                support@fixflowtally.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </main>

      <footer className="border-t py-8 text-center text-[12px]" style={{ borderColor: "rgba(255,255,255,0.06)", color: "#4a6a4a" }}>
        © 2026 Fixflow Technologies Pvt Ltd. ·{" "}
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
      </footer>
    </div>
  );
}
