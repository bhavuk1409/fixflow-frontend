"use client";

/**
 * /sso-callback/page.tsx
 * Clerk redirects here after OAuth signup (Google/Apple/Microsoft).
 * We send the welcome email for new users, then redirect to dashboard.
 */

import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { buildApi } from "@/lib/api";

function WelcomeEmailTrigger() {
  const { user, isLoaded } = useUser();
  const sent = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || sent.current) return;
    sent.current = true;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    // Only send if user was just created (within the last 60 seconds)
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const isNewUser = Date.now() - createdAt < 60_000;
    if (!isNewUser) return;

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
    buildApi().auth.welcome(email, name).catch(() => {});
  }, [isLoaded, user]);

  return null;
}

export default function SSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback />
      <WelcomeEmailTrigger />
    </>
  );
}
