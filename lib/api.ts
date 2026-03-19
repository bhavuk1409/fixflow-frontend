// Proxy-based fetch helper for backend API calls
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `/api/proxy?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

// Minimal ChatMessage type for chat API
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tool_calls_made?: string[];
};
// Replace the existing BASE_URL and clients with a proxy-based fetch that works behind Vercel

const PROXY_BASE = "/api/proxy";

export function buildApi() {
  return {
    health: async () => apiFetch("/health", { method: "GET" }),

    pair: {
      create: async (tenantId: string) =>
        apiFetch("/pair/create", {
          method: "POST",
          body: JSON.stringify({ tenant_id: tenantId }),
        }),
      status: async (code: string) =>
        apiFetch(`/pair/status/${code}`, { method: "GET" }),
    },

    companies: {
      list: async (tenantId: string) =>
        apiFetch(`/tenants/${tenantId}/companies`, { method: "GET" }),
    },

    insights: {
      pnl: async (tenantId: string, companyId: string, from: string, to: string) =>
        apiFetch(
          `/insights/${tenantId}/companies/${companyId}/pnl?from_date=${from}&to_date=${to}`,
          { method: "GET" },
        ),
      cashflow: async (tenantId: string, companyId: string, from: string, to: string) =>
        apiFetch(
          `/insights/${tenantId}/companies/${companyId}/cashflow?from_date=${from}&to_date=${to}`,
          { method: "GET" },
        ),
      receivables: async (tenantId: string, companyId: string, asOf: string, limit = 10) =>
        apiFetch(
          `/insights/${tenantId}/companies/${companyId}/receivables?as_of=${asOf}&limit=${limit}`,
          { method: "GET" },
        ),
      payables: async (tenantId: string, companyId: string, asOf: string, limit = 10) =>
        apiFetch(
          `/insights/${tenantId}/companies/${companyId}/payables?as_of=${asOf}&limit=${limit}`,
          { method: "GET" },
        ),
    },

    reports: {
      generate: async (tenantId: string, companyId: string, from: string, to: string, reportType = "weekly") =>
        apiFetch(`/reports/${tenantId}/companies/${companyId}/generate`, {
          method: "POST",
          body: JSON.stringify({ from_date: from, to_date: to, report_type: reportType }),
        }),
      list: async (tenantId: string, companyId: string, limit = 20) =>
        apiFetch(
          `/reports/${tenantId}/companies/${companyId}?limit=${limit}`,
          { method: "GET" },
        ),
      get: async (tenantId: string, companyId: string, reportId: string) =>
        apiFetch(
          `/reports/${tenantId}/companies/${companyId}/${reportId}`,
          { method: "GET" },
        ),
      download: async (tenantId: string, companyId: string, reportId: string) =>
        apiFetch(
          `/reports/${tenantId}/companies/${companyId}/${reportId}/download`,
          { method: "GET" },
        ),
      sendEmail: async (tenantId: string, companyId: string, reportId: string) =>
        apiFetch(
          `/reports/${tenantId}/companies/${companyId}/${reportId}/send-email`,
          { method: "POST" },
        ),
      delete: async (tenantId: string, companyId: string, reportId: string) =>
        apiFetch(
          `/reports/${tenantId}/companies/${companyId}/${reportId}`,
          { method: "DELETE" },
        ),
    },

    chat: {
      stream: async (
        tenantId: string,
        companyId: string,
        messages: { role: string; content: string }[],
        getToken: () => Promise<string | null>,
      ): Promise<ReadableStream<Uint8Array>> => {
        const token = await getToken();
        const res = await fetch(
          `/api/proxy?path=/chat/${tenantId}/companies/${companyId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ messages }),
          },
        );
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(text || `Chat request failed (${res.status})`);
        }
        return res.body!;
      },

      threads: {
        list: async (tenantId: string, companyId: string) =>
          apiFetch(
            `/chat/${tenantId}/companies/${companyId}/threads`,
            { method: "GET" },
          ),
        get: async (tenantId: string, companyId: string, threadId: string) =>
          apiFetch(
            `/chat/${tenantId}/companies/${companyId}/threads/${threadId}`,
            { method: "GET" },
          ),
        save: async (
          tenantId: string,
          companyId: string,
          messages: ChatMessage[],
          threadId?: string,
          title?: string,
        ) =>
          apiFetch(
            `/chat/${tenantId}/companies/${companyId}/threads`,
            {
              method: "POST",
              body: JSON.stringify({ thread_id: threadId ?? null, title: title ?? null, messages }),
            },
          ),
        delete: async (tenantId: string, companyId: string, threadId: string) =>
          apiFetch(
            `/chat/${tenantId}/companies/${companyId}/threads/${threadId}`,
            { method: "DELETE" },
          ),
      },
    },

    settings: {
      get: async (tenantId: string) => apiFetch(`/settings/${tenantId}`, { method: "GET" }),
      patch: async (tenantId: string, data: Record<string, unknown>) =>
        apiFetch(`/settings/${tenantId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    connector: {
      status: async (tenantId: string) =>
        apiFetch(`/connector/status/${tenantId}`, { method: "GET" }),
    },
  };
}
// ...existing code...
