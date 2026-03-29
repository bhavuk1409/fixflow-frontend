"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Globe,
  HelpCircle,
  Laptop,
  Router,
  Settings2,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] },
  }),
};

const pageBg = "#0a1a0f";
const accent = "#4ade80";
const softText = "#93b99f";
const cardStyle = {
  background: "rgba(74,222,128,0.04)",
  border: "1px solid rgba(74,222,128,0.14)",
};

type SectionIcon = ComponentType<{ className?: string; style?: CSSProperties }>;

const toc = [
  { id: "overview", label: "Overview" },
  { id: "quick-setup", label: "Quick Setup" },
  { id: "checklist", label: "Pre-Setup Checklist" },
  { id: "connect-company", label: "Connect Your Tally Company" },
  { id: "remote-access", label: "Optional Remote Access Setup" },
  { id: "security", label: "Security Recommendations" },
  { id: "use-fixflow", label: "Use Fixflow After Connection" },
  { id: "sync", label: "Sync and Refresh Behavior" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "faq", label: "Frequently Asked Questions" },
  { id: "support", label: "Support Checklist" },
];

function CommandBlock({ command }: { command: string }) {
  return (
    <pre
      className="overflow-x-auto rounded-xl px-4 py-3 text-sm"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(74,222,128,0.2)",
      }}
    >
      <code>{command}</code>
    </pre>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: SectionIcon; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: "rgba(74,222,128,0.15)" }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
      <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
    </div>
  );
}

function DocSection({
  id,
  index,
  icon,
  title,
  children,
}: {
  id: string;
  index: number;
  icon: SectionIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="rounded-2xl p-6"
      style={cardStyle}
    >
      <SectionTitle icon={icon} title={title} />
      {children}
    </motion.section>
  );
}

export default function DocsPage() {
  return (
    <main style={{ background: pageBg, minHeight: "100vh", color: "#e8f5e9" }}>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(10,26,15,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(74,222,128,0.12)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: accent }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fixflow
        </Link>

        <Link
          href="/app/connect"
          className="rounded-full px-5 py-2 text-sm font-bold text-black transition hover:opacity-90"
          style={{ background: accent }}
        >
          Connect Tally
        </Link>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-12 lg:px-10">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
            Documentation
          </p>
          <h1 className="text-4xl font-black leading-tight text-white md:text-5xl">
            Fixflow Connector Deployment Guide
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed" style={{ color: softText }}>
            This guide provides a production-ready setup flow for connecting TallyPrime to Fixflow. It includes a
            standard onboarding flow for most teams and an optional remote access deployment for advanced use cases.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.12em]" style={{ color: "#79aa86" }}>
            Last updated: March 20, 2026
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-12">
          <motion.aside
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-2xl p-5" style={cardStyle}>
              <p className="mb-4 text-sm font-semibold" style={{ color: accent }}>
                On this page
              </p>
              <ul className="space-y-2 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="transition-colors hover:text-white"
                      style={{ color: "#b9dfc5" }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>

          <div className="space-y-6 lg:col-span-8">
            <DocSection id="overview" index={2} icon={BookOpenCheck} title="Overview">
              <p className="text-sm leading-relaxed" style={{ color: softText }}>
                Most deployments are completed in under 15 minutes. For regular office operations, no router
                configuration is required.
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: softText }}>
                Use the optional remote access section only when users need access from outside the office network.
              </p>
            </DocSection>

            <DocSection id="quick-setup" index={3} icon={CheckCircle2} title="Quick Setup">
              <ol className="space-y-3 text-sm leading-relaxed" style={{ color: softText }}>
                <li>1. Install the Fixflow connector on the same system where TallyPrime is running.</li>
                <li>2. Open Fixflow and navigate to App &gt; Connect Tally.</li>
                <li>3. Generate a pairing code.</li>
                <li>4. Enter the pairing code in the connector application.</li>
                <li>5. Keep TallyPrime open until initial sync completes.</li>
                <li>6. Verify Connected status in Fixflow.</li>
              </ol>
            </DocSection>

            <DocSection id="checklist" index={4} icon={ClipboardList} title="Pre-Setup Checklist">
              <ul className="space-y-2 text-sm" style={{ color: softText }}>
                <li>- TallyPrime is installed and a company is open.</li>
                <li>- You can install software on the Tally system.</li>
                <li>- Internet connection is stable for initial sync.</li>
                <li>- You can access your Fixflow account.</li>
              </ul>
            </DocSection>

            <DocSection id="connect-company" index={5} icon={Laptop} title="Connect Your Tally Company">
              <h3 className="text-base font-semibold text-white">Step 1: Open Connect Tally</h3>
              <p className="mt-2 text-sm" style={{ color: softText }}>
                Go to{" "}
                <Link href="/app/connect" className="underline" style={{ color: accent }}>
                  Connect Tally
                </Link>{" "}
                inside the Fixflow application.
              </p>

              <h3 className="mt-5 text-base font-semibold text-white">Step 2: Install and Pair</h3>
              <ol className="mt-2 space-y-2 text-sm" style={{ color: softText }}>
                <li>1. Download and install the connector.</li>
                <li>2. Click Generate Pairing Code in Fixflow.</li>
                <li>3. Enter the 6-digit code in the connector app.</li>
              </ol>

              <h3 className="mt-5 text-base font-semibold text-white">Step 3: Verify Initial Sync</h3>
              <ol className="mt-2 space-y-2 text-sm" style={{ color: softText }}>
                <li>1. Keep both TallyPrime and connector app open.</li>
                <li>2. Wait for first sync to finish.</li>
                <li>3. Confirm status changes to Connected.</li>
              </ol>

              <div
                className="mt-4 rounded-xl p-4"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <p className="text-sm font-semibold text-white">If connector cannot reach Tally</p>
                <p className="mt-2 text-sm" style={{ color: softText }}>
                  In TallyPrime, open F1 (Help) &gt; Settings &gt; Connectivity and set Port Number to 9000.
                </p>
              </div>
            </DocSection>

            <DocSection
              id="remote-access"
              index={6}
              icon={Router}
              title="Optional Remote Access Setup (Port 9000 Deployment)"
            >
              <p className="text-sm leading-relaxed" style={{ color: softText }}>
                This section is required only if users need to connect from outside the office network.
              </p>

              <h3 className="mt-4 text-base font-semibold text-white">1. Configure TallyPrime</h3>
              <ol className="mt-2 space-y-2 text-sm" style={{ color: softText }}>
                <li>1. Open TallyPrime.</li>
                <li>2. Navigate to F1 (Help) &gt; Settings &gt; Connectivity.</li>
                <li>3. Set Port Number to 9000.</li>
                <li>4. Enable ODBC Server if your deployment requires it.</li>
                <li>5. In license settings, enable Allow Remote Access.</li>
              </ol>

              <h3 className="mt-5 text-base font-semibold text-white">2. Create Windows Firewall Rule</h3>
              <ol className="mt-2 space-y-2 text-sm" style={{ color: softText }}>
                <li>1. Open Windows Defender Firewall with Advanced Settings.</li>
                <li>2. Create a new inbound rule for TCP port 9000.</li>
                <li>3. Allow the connection for Domain, Private, and Public profiles.</li>
              </ol>

              <p className="mt-3 text-sm" style={{ color: softText }}>
                Verification command:
              </p>
              <CommandBlock command={`netstat -an | find "9000"`} />
              <p className="mt-2 text-sm" style={{ color: softText }}>
                Expected: <span className="text-white">TCP 0.0.0.0:9000 LISTENING</span>
              </p>

              <h3 className="mt-5 text-base font-semibold text-white">3. Identify Local IP and Validate LAN</h3>
              <p className="mt-2 text-sm" style={{ color: softText }}>
                Get local IP:
              </p>
              <CommandBlock command={`ipconfig`} />
              <p className="mt-2 text-sm" style={{ color: softText }}>
                Test from another device in the same network using <span className="text-white">192.168.x.x:9000</span>
              </p>

              <h3 className="mt-5 text-base font-semibold text-white">4. Configure Router Port Forwarding</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.2)" }}>
                      <th className="px-3 py-2 font-semibold text-white">Parameter</th>
                      <th className="px-3 py-2 font-semibold text-white">Value</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: softText }}>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
                      <td className="px-3 py-2">External Port</td>
                      <td className="px-3 py-2">9000</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
                      <td className="px-3 py-2">Internal Port</td>
                      <td className="px-3 py-2">9000</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
                      <td className="px-3 py-2">Internal IP</td>
                      <td className="px-3 py-2">192.168.x.x</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Protocol</td>
                      <td className="px-3 py-2">TCP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-5 text-base font-semibold text-white">5. Validate External Reachability</h3>
              <ol className="mt-2 space-y-2 text-sm" style={{ color: softText }}>
                <li>
                  1. Find public IP from{" "}
                  <a
                    href="https://whatismyipaddress.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: accent }}
                  >
                    whatismyipaddress.com
                  </a>
                  .
                </li>
                <li>2. Test from outside network using PUBLIC_IP:9000.</li>
              </ol>
            </DocSection>

            <DocSection id="security" index={7} icon={ShieldAlert} title="Security Recommendations">
              <p className="text-sm leading-relaxed" style={{ color: softText }}>
                For production environments, use secure network practices for any remote deployment.
              </p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: softText }}>
                <li>- Prefer VPN access over direct public port exposure.</li>
                <li>- Restrict allowed source IP ranges in firewall and router policies.</li>
                <li>- Keep TallyPrime and Windows updates current.</li>
                <li>- Disable unnecessary services on the connector host machine.</li>
                <li>- Enforce strong administrator credentials.</li>
              </ul>
            </DocSection>

            <DocSection id="use-fixflow" index={8} icon={Sparkles} title="Use Fixflow After Connection">
              <ul className="space-y-3 text-sm" style={{ color: softText }}>
                <li>
                  -{" "}
                  <Link href="/app/dashboard" className="underline" style={{ color: accent }}>
                    Dashboard
                  </Link>
                  : live financial overview and key metrics.
                </li>
                <li>
                  -{" "}
                  <Link href="/app/ask" className="underline" style={{ color: accent }}>
                    Ask
                  </Link>
                  : natural-language analysis on synchronized Tally data.
                </li>
                <li>
                  -{" "}
                  <Link href="/app/reports" className="underline" style={{ color: accent }}>
                    Reports
                  </Link>
                  : scheduled and generated financial reports.
                </li>
                <li>
                  -{" "}
                  <Link href="/app/settings" className="underline" style={{ color: accent }}>
                    Settings
                  </Link>
                  : alerting and account-level controls.
                </li>
              </ul>
            </DocSection>

            <DocSection id="sync" index={9} icon={Settings2} title="Sync and Refresh Behavior">
              <ul className="space-y-2 text-sm" style={{ color: softText }}>
                <li>- Initial sync starts immediately after pairing.</li>
                <li>- Automatic sync runs every 5 minutes while connector is active.</li>
                <li>- Keep both TallyPrime and connector app running for continuous updates.</li>
                <li>- Connector is read-only and does not modify accounting data.</li>
              </ul>

              <div
                className="mt-4 rounded-xl p-4"
                style={{
                  background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <p className="text-sm" style={{ color: "#d8f7df" }}>
                  For compliance and data policies, refer to{" "}
                  <Link href="/privacy" className="underline" style={{ color: accent }}>
                    Privacy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="underline" style={{ color: accent }}>
                    Terms
                  </Link>
                  .
                </p>
              </div>
            </DocSection>

            <DocSection id="troubleshooting" index={10} icon={Wrench} title="Troubleshooting">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.2)" }}>
                      <th className="px-3 py-2 font-semibold text-white">Issue</th>
                      <th className="px-3 py-2 font-semibold text-white">Likely Cause</th>
                      <th className="px-3 py-2 font-semibold text-white">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: softText }}>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
                      <td className="px-3 py-2">Pairing code rejected</td>
                      <td className="px-3 py-2">Code expired</td>
                      <td className="px-3 py-2">Generate a new code and retry immediately</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
                      <td className="px-3 py-2">Connector cannot connect to Tally</td>
                      <td className="px-3 py-2">Tally offline or port mismatch</td>
                      <td className="px-3 py-2">Open TallyPrime and verify connectivity port is 9000</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
                      <td className="px-3 py-2">Connected but recent data not visible</td>
                      <td className="px-3 py-2">Initial sync still processing</td>
                      <td className="px-3 py-2">Keep connector running and refresh dashboard after a few minutes</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Accessible in office but not externally</td>
                      <td className="px-3 py-2">Remote network path not configured</td>
                      <td className="px-3 py-2">Complete remote access deployment or switch to VPN/tunnel</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            <DocSection id="faq" index={11} icon={HelpCircle} title="Frequently Asked Questions">
              <div className="space-y-4 text-sm" style={{ color: softText }}>
                <div>
                  <p className="font-semibold text-white">Is remote port configuration mandatory?</p>
                  <p className="mt-1">No. It is required only for external network access.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Does Fixflow write back to Tally?</p>
                  <p className="mt-1">No. Connector behavior is read-only.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">How often is data refreshed?</p>
                  <p className="mt-1">Every 5 minutes while connector is running.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">What should remain open for continuous sync?</p>
                  <p className="mt-1">Keep both TallyPrime and connector application active.</p>
                </div>
              </div>
            </DocSection>

            <DocSection id="support" index={12} icon={Globe} title="Support Checklist">
              <p className="text-sm leading-relaxed" style={{ color: softText }}>
                Share the details below for faster resolution:
              </p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: softText }}>
                <li>- Company name shown on the Connect Tally page.</li>
                <li>- Screenshot of connector status and visible error message.</li>
                <li>- Whether issue occurs on office network, external network, or both.</li>
                <li>- Confirmation of whether remote access deployment was configured.</li>
              </ul>

              <p className="mt-4 text-sm" style={{ color: softText }}>
                Support contact:{" "}
                <a className="underline" href="mailto:support@fixflowtally.com" style={{ color: accent }}>
                  support@fixflowtally.com
                </a>
              </p>
            </DocSection>
          </div>
        </div>
      </div>
    </main>
  );
}
