"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildApi } from "@/lib/api";

/* ── OAuth provider icons ───────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
    <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
    <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
    <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
  </svg>
);

function OAuthButton({ onClick, icon, label, loading }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border text-[13px] font-medium text-white transition-all hover:border-white/20 hover:bg-white/5 disabled:opacity-50 active:scale-[0.98]"
      style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
    >
      {icon}
      {label}
    </button>
  );
}

export function SignUpForm() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // OTP verification step
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp || !setActive) return;
    setError("");
    setLoading(true);
    try {
      await signUp.create({ firstName, lastName, emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp || !setActive) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Send welcome email (fire-and-forget — never blocks redirect)
        const name = [firstName, lastName].filter(Boolean).join(" ") || undefined;
        buildApi().auth.welcome(email, name).catch(() => {});

        router.push("/app/dashboard");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "oauth_google" | "oauth_apple" | "oauth_microsoft") {
    if (!isLoaded || !signUp) return;
    setOauthLoading(provider);
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/app/dashboard",
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "OAuth sign-up failed.");
      setOauthLoading(null);
    }
  }

  const inputClass =
    "h-12 w-full rounded-full border px-5 text-[14px] text-white placeholder:text-white/30 outline-none transition-all";
  const inputStyle = { background: "rgba(74,222,128,0.04)", borderColor: "rgba(74,222,128,0.18)" };
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = "#4ade80");
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = "rgba(74,222,128,0.18)");

  if (pendingVerification) {
    return (
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-[26px] font-bold tracking-tight text-white">Check your email</h1>
          <p className="mt-1.5 text-[14px]" style={{ color: "#8fa88f" }}>
            We sent a verification code to {email}
          </p>
        </div>
        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-white">Verification code</label>
            <input
              type="text"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
          </div>
          {error && (
            <p className="rounded-full px-4 py-2 text-[13px] text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-12 w-full rounded-full text-[15px] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#4ade80" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#22c55e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#4ade80")}
          >
            {loading ? "Verifying…" : "Verify →"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: "#8fa88f" }}>
          Start your free Fixflow account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* OAuth buttons */}
        <div className="flex flex-col gap-2.5">
          <OAuthButton
            onClick={() => handleOAuth("oauth_google")}
            icon={<GoogleIcon />}
            label="Continue with Google"
            loading={oauthLoading === "oauth_google"}
          />
          <OAuthButton
            onClick={() => handleOAuth("oauth_apple")}
            icon={<AppleIcon />}
            label="Continue with Apple"
            loading={oauthLoading === "oauth_apple"}
          />
          <OAuthButton
            onClick={() => handleOAuth("oauth_microsoft")}
            icon={<MicrosoftIcon />}
            label="Continue with Microsoft"
            loading={oauthLoading === "oauth_microsoft"}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t" style={{ borderColor: "rgba(74,222,128,0.12)" }} />
          <span className="text-[12px] font-medium" style={{ color: "#4a6a4a" }}>or sign up with email</span>
          <div className="flex-1 border-t" style={{ borderColor: "rgba(74,222,128,0.12)" }} />
        </div>

        {/* Name row */}
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[13px] font-medium text-white">First name</label>
            <input
              type="text"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-[13px] font-medium text-white">Last name</label>
            <input
              type="text"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-white">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
            onFocus={focusIn}
            onBlur={focusOut}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-white">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${inputClass} pr-12`}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-full px-4 py-2 text-[13px] text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isLoaded}
          className="mt-1 h-12 w-full rounded-full text-[15px] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "#4ade80" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#22c55e")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#4ade80")}
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-7 text-center text-[13px]" style={{ color: "#6b8a6b" }}>
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold transition-colors" style={{ color: "#4ade80" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
