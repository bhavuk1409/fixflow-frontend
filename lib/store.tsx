"use client";

/**
 * lib/store.ts
 * Minimal client-side state: selected tenant + company, global date range.
 * Uses plain React context so there's no extra dependency.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { isoDate, lastNDays } from "./utils";
import { getTenantId, getCompanyId } from "./auth";
import { useOrganization, useUser } from "@clerk/nextjs";

interface AppState {
  tenantId: string;
  companyId: string;
  setCompanyId: (id: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (r: { from: Date; to: Date }) => void;
  fromIso: string;
  toIso: string;
  todayIso: string;
}

const AppContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization();
  const { user } = useUser();
  const tenantId = getTenantId(organization?.id, user?.id);

  // Key localStorage per-user so different accounts never share state.
  const storageKey = user?.id ? `fixflow_company_id_${user.id}` : null;

  // Track the previous userId so we can detect account switches.
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // Start with env default so dashboard never shows empty state on first render.
  // The useEffect below will override with whatever the user last selected.
  const [companyId, setCompanyId] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? ""
  );

  // Reset companyId whenever the signed-in user changes.
  useEffect(() => {
    // Skip the very first render (undefined → first real value) only if it's
    // the same user. If the user actually changed, always reset.
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current === user?.id) return;
    prevUserIdRef.current = user?.id;

    if (!storageKey) {
      // Signed out — clear immediately
      setCompanyId("");
      return;
    }
    const stored = localStorage.getItem(storageKey);
    const resolved = getCompanyId(stored);
    setCompanyId(resolved || (process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? ""));
  }, [storageKey, user?.id]);

  const [dateRange, setDateRangeRaw] = useState<{ from: Date; to: Date }>(
    () => lastNDays(30),
  );

  const setCompanyIdPersist = (id: string) => {
    setCompanyId(id);
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(storageKey, id);
    }
  };

  const setDateRange = (r: { from: Date; to: Date }) => setDateRangeRaw(r);

  const today = new Date();
  return (
    <AppContext.Provider
      value={{
        tenantId,
        companyId,
        setCompanyId: setCompanyIdPersist,
        dateRange,
        setDateRange,
        fromIso: isoDate(dateRange.from),
        toIso: isoDate(dateRange.to),
        todayIso: isoDate(today),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
