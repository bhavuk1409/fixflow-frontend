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

export type RazorpayBillingCycle = "monthly" | "yearly";
export type RazorpayPlanId = "growth";

export type RazorpayCreateOrderRequest = {
  plan_id?: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
};

export type RazorpayCreateOrderResponse = {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  plan_id: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  business_name: string;
  description: string;
};

export type RazorpayVerifyPaymentRequest = {
  plan_id?: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayVerifyPaymentResponse = {
  status: "verified";
  order_id: string;
  payment_id: string;
  plan_id: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
};

export type RazorpayCreateSubscriptionRequest = {
  plan_id?: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
};

export type RazorpayCreateSubscriptionResponse = {
  key_id: string;
  subscription_id: string;
  plan_id: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  business_name: string;
  description: string;
};

export type RazorpayVerifySubscriptionRequest = {
  plan_id?: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayVerifySubscriptionResponse = {
  status: "verified";
  subscription_id: string;
  payment_id: string;
  plan_id: RazorpayPlanId;
  billing_cycle: RazorpayBillingCycle;
  subscription_status: string;
};

export type RazorpayCancelSubscriptionResponse = {
  status: "cancelled" | "cancel_requested";
  subscription_id: string;
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
    let message = text || `Request failed with status ${res.status}`;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed && typeof parsed === "object") {
        if (typeof (parsed as { detail?: unknown }).detail === "string") {
          message = (parsed as { detail: string }).detail;
        } else if (typeof (parsed as { error?: unknown }).error === "string") {
          message = (parsed as { error: string }).error;
        }
      }
    } catch {
      // Keep raw text fallback.
    }
    throw new Error(message);
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
      delete: async (tenantId: string, companyId: string) =>
        apiFetch(`/tenants/${tenantId}/companies/${companyId}`, { method: "DELETE" }),
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
          let message = text || `Chat request failed (${res.status})`;
          try {
            const parsed = text ? JSON.parse(text) : null;
            if (parsed && typeof parsed === "object") {
              if (typeof (parsed as { detail?: unknown }).detail === "string") {
                message = (parsed as { detail: string }).detail;
              } else if (typeof (parsed as { error?: unknown }).error === "string") {
                message = (parsed as { error: string }).error;
              }
            }
          } catch {
            // Keep raw text fallback.
          }
          throw new Error(message);
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

    payments: {
      createRazorpayOrder: async (
        tenantId: string,
        payload: RazorpayCreateOrderRequest,
      ) =>
        apiFetch<RazorpayCreateOrderResponse>(
          `/payments/${tenantId}/razorpay/order`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      verifyRazorpayPayment: async (
        tenantId: string,
        payload: RazorpayVerifyPaymentRequest,
      ) =>
        apiFetch<RazorpayVerifyPaymentResponse>(
          `/payments/${tenantId}/razorpay/verify`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      createRazorpaySubscription: async (
        tenantId: string,
        payload: RazorpayCreateSubscriptionRequest,
      ) =>
        apiFetch<RazorpayCreateSubscriptionResponse>(
          `/payments/${tenantId}/razorpay/subscription`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      verifyRazorpaySubscription: async (
        tenantId: string,
        payload: RazorpayVerifySubscriptionRequest,
      ) =>
        apiFetch<RazorpayVerifySubscriptionResponse>(
          `/payments/${tenantId}/razorpay/subscription/verify`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      cancelRazorpaySubscription: async (tenantId: string) =>
        apiFetch<RazorpayCancelSubscriptionResponse>(
          `/payments/${tenantId}/razorpay/subscription/cancel`,
          {
            method: "POST",
          },
        ),
    },

    connector: {
      status: async (tenantId: string) =>
        apiFetch(`/connector/status/${tenantId}`, { method: "GET" }),
    },
  };
}
