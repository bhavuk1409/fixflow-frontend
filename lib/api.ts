export type Company = {
  id: string;
  name: string;
  tenant_id?: string;
  last_synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReportStatus = "queued" | "generating" | "done" | "failed";

export type Report = {
  id: string;
  tenant_id: string;
  company_id: string;
  report_type: string;
  period_from: string;
  period_to: string;
  status: ReportStatus;
  has_pdf: boolean;
  email_sent_at?: string | null;
  error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tool_calls_made?: string[];
};

export type ChatThread = {
  id: string;
  tenant_id: string;
  company_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
};

export type ApiResponse<T = any> = {
  data: T;
};

function normalizePayload<T>(payload: unknown): ApiResponse<T> {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload as ApiResponse<T>;
  }
  return { data: payload as T };
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
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
    const payload = await res.json();
    return normalizePayload<T>(payload);
  }
  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream")
  ) {
    const payload = await res.arrayBuffer();
    return { data: payload as T };
  }
  const payload = await res.text();
  return { data: payload as T };
}

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
