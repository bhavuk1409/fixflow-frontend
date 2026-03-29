"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a1a0f", color: "#e8f5e9" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "rgba(74,222,128,0.08)", background: "rgba(10,26,15,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="mx-auto flex h-[60px] max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-medium transition hover:text-white" style={{ color: "#8fa88f" }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Fixflow
          </Link>
          <span className="text-[14px] font-bold text-white">Terms of Service</span>
          <Link href="/privacy" className="text-[13px] font-medium transition hover:text-white" style={{ color: "#8fa88f" }}>
            Privacy →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-12">
            <div className="mb-4 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>
              Last updated: March 2026
            </div>
            <h1 className="text-[44px] font-extrabold tracking-tight text-white">Terms of Service</h1>
            <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "#8fa88f" }}>
              By using Fixflow, you agree to these terms. Please read them carefully.
            </p>
          </motion.div>

          {[
            {
              title: "1. Acceptance of Terms",
              content: `By accessing or using Fixflow ("the Service"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Service. These terms apply to all users, including businesses and individuals who access the platform.`,
            },
            {
              title: "2. Description of Service",
              content: `Fixflow is a financial intelligence platform that connects to Tally software to provide live dashboards, AI-powered insights, automated reports, and financial analytics. The Service is provided as a SaaS platform accessible via web browser and a companion desktop connector application.`,
            },
            {
              title: "3. Account Registration",
              content: `You must create an account to use Fixflow. You are responsible for maintaining the confidentiality of your credentials. You agree to provide accurate, current, and complete information. You are responsible for all activity that occurs under your account. Notify us immediately at support@fixflowtally.com if you suspect unauthorised access.`,
            },
            {
              title: "4. Acceptable Use",
              content: `You agree not to misuse the Service. Prohibited activities include: attempting to reverse-engineer or extract the source code of the platform; using the Service to store or transmit malicious code; attempting to gain unauthorised access to any part of the Service; using the Service in violation of any applicable law or regulation.`,
            },
            {
              title: "5. Data & Tally Connector",
              content: `The Fixflow desktop connector is a read-only tool. It accesses your Tally data solely to provide the features of the Service. You represent that you have the right to share this data with Fixflow. You retain full ownership of your financial data. Fixflow does not claim any ownership over your business data.`,
            },
            {
              title: "6. Subscription & Billing",
              content: `Fixflow offers a free Starter plan and paid plans billed monthly or annually. Paid plans auto-renew unless cancelled before the renewal date. Refunds are not provided for partial billing periods. Pricing is subject to change with 30 days' notice. Enterprise pricing is negotiated separately.`,
            },
            {
              title: "7. Intellectual Property",
              content: `The Fixflow platform, including its design, algorithms, AI models, and code, is the intellectual property of Fixflow Technologies Pvt Ltd. You may not copy, modify, or distribute any part of the platform without written permission. You retain full ownership of your data.`,
            },
            {
              title: "8. Limitation of Liability",
              content: `Fixflow provides financial data and insights for informational purposes only. Nothing on the platform constitutes financial, tax, or legal advice. We are not liable for any business decisions made based on data shown in Fixflow. Our total liability is limited to the amount paid by you in the 12 months preceding the claim.`,
            },
            {
              title: "9. Termination",
              content: `You may cancel your account at any time from the Settings page. Fixflow reserves the right to suspend or terminate accounts that violate these terms. On termination, your data will be retained for 30 days before permanent deletion.`,
            },
            {
              title: "10. Governing Law",
              content: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka. If any provision is found unenforceable, the remaining provisions remain in full effect.`,
            },
          ].map((section) => (
            <motion.div key={section.title} variants={fadeUp} className="mb-8">
              <h2 className="mb-3 text-[20px] font-bold text-white">{section.title}</h2>
              <p className="text-[15px] leading-[1.8]" style={{ color: "#8fa88f" }}>{section.content}</p>
            </motion.div>
          ))}

          <motion.div variants={fadeUp} className="mt-12 rounded-2xl border p-6" style={{ borderColor: "rgba(74,222,128,0.15)", background: "rgba(74,222,128,0.04)" }}>
            <p className="text-[13px]" style={{ color: "#6b8a6b" }}>
              Questions about these terms?{" "}
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
