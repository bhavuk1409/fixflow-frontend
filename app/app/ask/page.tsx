"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, RotateCcw, Sparkles, User, Database,
  ArrowUp, TrendingUp, Users, BarChart2, FileText, Lightbulb,
  Zap, Brain, MessageSquare, History, Trash2, ChevronLeft, Plus,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { useApi } from "@/lib/useApi";
import { Topbar } from "@/components/layout/Topbar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatThread } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// ── Suggestion categories ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: TrendingUp,  label: "Net profit this month?",  query: "What's my net profit this month?" },
  { icon: Users,       label: "Top debtors?",            query: "Who owes me the most money?" },
  { icon: BarChart2,   label: "Top expenses?",           query: "What are my top 5 expense categories?" },
  { icon: TrendingUp,  label: "Cashflow trend?",         query: "How is my cashflow trending?" },
  { icon: FileText,    label: "Financial summary",       query: "Summarise my financial health" },
  { icon: Lightbulb,   label: "Profit drop reason?",     query: "Why did my profit drop last month?" },
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-card">
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
          isUser ? "bg-secondary" : "bg-primary",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex max-w-[78%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card shadow-card dark:shadow-card-dark",
          )}
        >
          <div
            className={cn(
              "prose-chat whitespace-pre-wrap break-words",
              isUser ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {msg.content}
          </div>
        </div>

        {/* Tool call badges */}
        {!isUser && msg.tool_calls_made && msg.tool_calls_made.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Database className="h-3 w-3 text-muted-foreground/60" />
            {msg.tool_calls_made.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-secondary px-2 py-0.5 text-2xs font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Empty / welcome state ────────────────────────────────────────────────────
function WelcomeScreen({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col items-center justify-center gap-8 px-6 py-16 text-center"
    >
      {/* Icon mark */}
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-glow-primary">
          <Brain className="h-9 w-9 text-white" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-primary/20" />
        <div className="pointer-events-none absolute -inset-2 rounded-[28px] ring-1 ring-primary/10" />
      </div>

      {/* Copy */}
      <div className="max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Your AI CFO</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Ask anything about your business finances. I have live access to your Tally data —
          P&L, cashflow, receivables, payables, and more.
        </p>
      </div>

      {/* Context pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { icon: Zap, label: "Live Tally data" },
          { icon: Brain, label: "AI-powered analysis" },
          { icon: MessageSquare, label: "Plain English answers" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <Icon className="h-3 w-3 text-primary" />
            {label}
          </div>
        ))}
      </div>

      {/* Suggestion grid */}
      <div className="grid w-full max-w-lg grid-cols-2 gap-2.5 sm:grid-cols-3">
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.query}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggest(s.query)}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-all hover:border-primary/30 hover:shadow-card-hover"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <s.icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground leading-tight">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Thread history sidebar ────────────────────────────────────────────────────
function ThreadSidebar({
  threads,
  activeId,
  onSelect,
  onDelete,
  onNew,
  onClose,
}: {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (t: ChatThread) => void;
  onDelete: (t: ChatThread) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-border bg-card shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <span className="text-sm font-semibold text-foreground">Conversations</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            title="New conversation"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {threads.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">No saved conversations yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {threads.map((t) => (
              <li key={t.id}>
                <div
                  className={cn(
                    "group flex items-start justify-between rounded-lg px-3 py-2.5 text-sm transition",
                    activeId === t.id
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <button
                    onClick={() => onSelect(t)}
                    className="flex-1 text-left"
                  >
                    <p className="line-clamp-2 text-xs font-medium leading-snug">{t.title}</p>
                    <p className="mt-0.5 text-2xs text-muted-foreground/60">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => onDelete(t)}
                    title="Delete conversation"
                    className="ml-2 mt-0.5 flex-shrink-0 rounded p-1 text-muted-foreground/40 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AskPage() {
  const { tenantId, companyId } = useAppState();
  const api = useApi();
  const searchParams = useSearchParams();
  const { isSignedIn, user } = useUser();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);

  const [input, setInput] = useState(searchParams.get("q") ?? "");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingTools, setStreamingTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [planActive, setPlanActive] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  type RazorpayHandlerResponse = {
    razorpay_subscription_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  type RazorpayFailureResponse = {
    error?: {
      description?: string;
      reason?: string;
    };
  };

  type RazorpayCheckoutOptions = {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: { color: string };
    modal?: {
      ondismiss?: () => void;
    };
    handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  };

  const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

  const loadRazorpayScript = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if ((window as Window & { Razorpay?: unknown }).Razorpay) return true;
    return await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_CHECKOUT_URL;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradeCheckout = async () => {
    if (!isSignedIn || !user) {
      toast.error("Sign in to upgrade your plan.");
      return;
    }
    setUpgradeLoading(true);
    try {
      const scriptReady = await loadRazorpayScript();
      const RazorpayCtor = (window as Window & {
        Razorpay?: new (options: RazorpayCheckoutOptions) => {
          open: () => void;
          on: (event: "payment.failed", callback: (response: RazorpayFailureResponse) => void) => void;
        };
      }).Razorpay;
      if (!scriptReady || !RazorpayCtor) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const subscriptionRes = await api.payments.createRazorpaySubscription(tenantId, {
        plan_id: "growth",
        billing_cycle: "monthly",
        customer_name: user.fullName ?? undefined,
        customer_email: user.primaryEmailAddress?.emailAddress ?? undefined,
      });
      const subscription = subscriptionRes.data;

      const checkout = new RazorpayCtor({
        key: subscription.key_id,
        subscription_id: subscription.subscription_id,
        name: subscription.business_name,
        description: "Fixflow Growth Plan (₹99/month)",
        prefill: {
          name: user.fullName ?? "",
          email: user.primaryEmailAddress?.emailAddress ?? "",
        },
        notes: {
          tenant_id: tenantId,
          plan_id: "growth",
          billing_cycle: "monthly",
        },
        theme: { color: "#3B82F6" },
        modal: {
          ondismiss: () => toast.message("Checkout cancelled."),
        },
        handler: async (response) => {
          await api.payments.verifyRazorpaySubscription(tenantId, {
            plan_id: "growth",
            billing_cycle: "monthly",
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setPlanActive(true);
          setQueriesUsed(0);
          toast.success("Plan upgraded successfully (₹99/month).");
        },
      });

      checkout.on("payment.failed", (event) => {
        const reason = event.error?.description || event.error?.reason || "Payment failed.";
        toast.error(reason);
      });
      checkout.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      toast.error(message);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  // Load thread list when sidebar opens
  const loadThreads = useCallback(async () => {
    if (!tenantId || !companyId) return;
    setLoadingThreads(true);
    try {
      const res = await api.chat.threads.list(tenantId, companyId);
      setThreads(res.data.threads);
    } catch {
      toast.error("Failed to load conversation history");
    } finally {
      setLoadingThreads(false);
    }
  }, [api, tenantId, companyId]);

  useEffect(() => {
    if (showSidebar) loadThreads();
  }, [showSidebar, loadThreads]);

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const res = await api.settings.get(tenantId);
        if (!mounted) return;
        const settings = res.data as { plan_active?: boolean; ai_cfo_queries_used?: number };
        setPlanActive(Boolean(settings.plan_active));
        setQueriesUsed(Number(settings.ai_cfo_queries_used ?? 0));
      } catch {
        if (!mounted) return;
        setPlanActive(false);
        setQueriesUsed(0);
      }
    };
    loadSettings();
    return () => {
      mounted = false;
    };
  }, [api, tenantId]);

  // Auto-save thread after every complete AI reply
  const saveThread = useCallback(
    async (msgs: ChatMessage[]) => {
      if (!tenantId || !companyId || msgs.length === 0) return;
      setSaving(true);
      try {
        const res = await api.chat.threads.save(
          tenantId,
          companyId,
          msgs,
          activeThreadId ?? undefined,
        );
        setActiveThreadId(res.data.id);
        // Refresh sidebar list silently
        if (showSidebar) loadThreads();
      } catch {
        // Non-fatal — chat still works, just not saved
      } finally {
        setSaving(false);
      }
    },
    [api, tenantId, companyId, activeThreadId, showSidebar, loadThreads],
  );

  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || streaming) return;

    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(history);
    setInput("");
    setStreaming(true);
    setStreamingText("");
    setStreamingTools([]);

    try {
      const stream = await api.chat.stream(tenantId, companyId, history);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalTools: string[] = [];
      let accText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "token") {
              accText += event.text;
              setStreamingText(accText);
            } else if (event.type === "tool") {
              setStreamingTools((prev) => [...prev, event.name]);
              finalTools = [...finalTools, event.name];
            } else if (event.type === "done") {
              finalTools = event.tools_used ?? finalTools;
            } else if (event.type === "error") {
              toast.error(event.message ?? "AI error");
            }
          } catch {
            // malformed JSON line — skip
          }
        }
      }

      // Commit streamed message to history
      const finalMessages: ChatMessage[] = [
        ...history,
        { role: "assistant", content: accText, tool_calls_made: finalTools },
      ];
      setMessages(finalMessages);

      // Persist to backend
      await saveThread(finalMessages);
      if (!planActive) {
        setQueriesUsed((v) => Math.min(5, v + 1));
      }
    } catch (e: any) {
      const message = e?.message ?? "Failed to reach AI CFO";
      if (typeof message === "string" && message.toLowerCase().includes("starter limit reached")) {
        toast.message(message);
      } else {
        toast.error(message);
      }
    } finally {
      setStreaming(false);
      setStreamingText("");
      setStreamingTools([]);
    }
  };

  const handleSelectThread = (thread: ChatThread) => {
    setActiveThreadId(thread.id);
    setMessages(
      thread.messages.map((m) => ({
        role: m.role,
        content: m.content,
        tool_calls_made: m.tool_calls_made,
      })),
    );
    setShowSidebar(false);
  };

  const handleDeleteThread = async (thread: ChatThread) => {
    try {
      await api.chat.threads.delete(tenantId, companyId, thread.id);
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
      if (activeThreadId === thread.id) {
        setMessages([]);
        setActiveThreadId(null);
      }
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setActiveThreadId(null);
    setShowSidebar(false);
  };

  const handleClearCurrent = async () => {
    if (activeThreadId) {
      try {
        await api.chat.threads.delete(tenantId, companyId, activeThreadId);
        setThreads((prev) => prev.filter((t) => t.id !== activeThreadId));
        toast.success("Conversation deleted");
      } catch {
        // ignore — still clear the UI
      }
    }
    setMessages([]);
    setActiveThreadId(null);
    setStreamingText("");
  };

  const handleSend = () => sendMessage(input.trim());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = input.trim().length > 0 && !streaming;

  return (
    <div className="relative flex h-[calc(100vh-0px)] flex-col bg-background overflow-hidden">
      <Topbar title="AI CFO" />

      {/* Thread sidebar overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[2px]"
            />
            <ThreadSidebar
              threads={threads}
              activeId={activeThreadId}
              onSelect={handleSelectThread}
              onDelete={handleDeleteThread}
              onNew={handleNewConversation}
              onClose={() => setShowSidebar(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <WelcomeScreen onSuggest={(q) => sendMessage(q)} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
            </AnimatePresence>

            {/* Live streaming bubble */}
            {streaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex max-w-[78%] flex-col gap-1.5">
                  {streamingTools.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <Database className="h-3 w-3 text-muted-foreground/60" />
                      {streamingTools.map((t) => (
                        <span key={t} className="rounded-full border border-border bg-secondary px-2 py-0.5 text-2xs font-medium text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-card">
                    {streamingText ? (
                      <p className="prose-chat whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                        {streamingText}
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {!planActive && (
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs font-medium text-foreground">
                Starter plan: {Math.max(0, 5 - queriesUsed)} of 5 AI CFO queries left this month.
              </p>
              <button
                onClick={handleUpgradeCheckout}
                disabled={upgradeLoading}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {upgradeLoading ? "Opening..." : "Upgrade"}
              </button>
            </div>
          )}
          {/* Suggestion chips after first message */}
          {messages.length > 0 && messages.length < 4 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s.query}
                  onClick={() => sendMessage(s.query)}
                  disabled={streaming}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                >
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="relative flex items-end gap-2">
            {/* History button */}
            <button
              onClick={() => setShowSidebar(true)}
              title="Conversation history"
              className="mb-1.5 flex-shrink-0 rounded-xl p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <History className="h-4 w-4" />
            </button>

            {/* Clear / delete current button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearCurrent}
                title="Delete this conversation"
                disabled={streaming}
                className="mb-1.5 flex-shrink-0 rounded-xl p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <div
              className={cn(
                "relative flex-1 rounded-2xl border border-border bg-background shadow-sm transition-all",
                canSend && "border-primary/30 shadow-input-focus",
                "focus-within:border-primary/30 focus-within:shadow-input-focus",
              )}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI CFO anything…"
                className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ minHeight: "2.75rem", maxHeight: "8.75rem" }}
              />

              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  canSend
                    ? "bg-primary text-primary-foreground shadow-glow-primary hover:opacity-90 active:scale-95"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-2xs text-muted-foreground/60">
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving…
              </span>
            ) : (
              "AI CFO uses live Tally data · Responses may contain inaccuracies"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
