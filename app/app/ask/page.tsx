"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BarChart2,
  Brain,
  ChevronLeft,
  Database,
  FileText,
  History,
  Lightbulb,
  Loader2,
  Plus,
  TrendingUp,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { ChatMessage, ChatThread } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/layout/Topbar";
import { AICfoLogo } from "@/components/ui/ai-cfo-logo";

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Net profit this month?", query: "What's my net profit this month?" },
  { icon: Users, label: "Top debtors?", query: "Who owes me the most money?" },
  { icon: BarChart2, label: "Top expenses?", query: "What are my top 5 expense categories?" },
  { icon: TrendingUp, label: "Cashflow trend?", query: "How is my cashflow trending?" },
  { icon: FileText, label: "Financial summary", query: "Summarise my financial health" },
  { icon: Lightbulb, label: "Profit drop reason?", query: "Why did my profit drop last month?" },
];

const TITLE_LOADING_PLACEHOLDER = "__TITLE_LOADING__";
const isTempThreadId = (id: string | null | undefined) => Boolean(id && id.startsWith("temp-thread-"));

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div className={cn("mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl", isUser ? "bg-secondary" : "bg-primary") }>
        {isUser ? <User className="h-4 w-4 text-white/80" /> : <AICfoLogo tone="on-primary" className="h-4 w-4" />}
      </div>
      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isUser && "items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm border border-border bg-card text-foreground",
        )}>
          <p className="prose-chat whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        {!isUser && msg.tool_calls_made && msg.tool_calls_made.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Database className="h-3 w-3 text-muted-foreground/60" />
            {msg.tool_calls_made.map((tool, idx) => (
              <span key={`${tool}-${idx}`} className="rounded-full border border-border bg-secondary px-2 py-0.5 text-2xs font-medium text-muted-foreground">
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThreadSidebar({
  threads,
  activeId,
  titleLoadingIds,
  onSelect,
  onDelete,
  onNew,
  onClose,
}: {
  threads: ChatThread[];
  activeId: string | null;
  titleLoadingIds: string[];
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
      className="absolute inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-border bg-card shadow-card-hover dark:shadow-card-dark-hover"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <span className="text-sm font-semibold text-foreground">Conversations</span>
        <div className="flex items-center gap-1">
          <button onClick={onNew} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Plus className="h-4 w-4" /></button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {threads.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">No saved conversations yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {threads.map((t) => {
              const titleLoading = titleLoadingIds.includes(t.id) || t.title === TITLE_LOADING_PLACEHOLDER;
              return (
                <li key={t.id}>
                  <div className={cn(
                    "group flex items-start justify-between rounded-lg px-3 py-2.5 text-sm transition",
                    activeId === t.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}>
                    <button onClick={() => onSelect(t)} className="flex-1 text-left">
                      <p className="line-clamp-2 text-xs font-medium leading-snug">
                        {titleLoading ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating title...
                          </span>
                        ) : (
                          t.title
                        )}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted-foreground/60">{new Date(t.updated_at).toLocaleDateString()}</p>
                    </button>
                    <button onClick={() => onDelete(t)} className="ml-2 mt-0.5 flex-shrink-0 rounded p-1 text-muted-foreground/40 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export default function AskPage() {
  const { tenantId, companyId } = useAppState();
  const api = useApi();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);

  const [input, setInput] = useState(searchParams.get("q") ?? "");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingTools, setStreamingTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [titleLoadingIds, setTitleLoadingIds] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
  }, [input]);

  const loadThreads = useCallback(async () => {
    if (!tenantId || !companyId) return;
    try {
      const res = await api.chat.threads.list(tenantId, companyId);
      setThreads(res.data.threads);
    } catch {
      toast.error("Failed to load conversation history");
    }
  }, [api, tenantId, companyId]);

  useEffect(() => {
    if (showSidebar) void loadThreads();
  }, [showSidebar, loadThreads]);

  const saveThread = useCallback(async (msgs: ChatMessage[]) => {
    if (!tenantId || !companyId || msgs.length === 0) return;
    const currentThreadId = activeThreadId;
    const persistedThreadId = currentThreadId && !isTempThreadId(currentThreadId) ? currentThreadId : undefined;
    const optimisticId = currentThreadId ?? `temp-thread-${Date.now()}`;
    const nowIso = new Date().toISOString();

    setTitleLoadingIds((prev) => (prev.includes(optimisticId) ? prev : [...prev, optimisticId]));
    if (currentThreadId) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === currentThreadId
            ? {
                ...t,
                title: TITLE_LOADING_PLACEHOLDER,
                updated_at: nowIso,
                messages: msgs,
              }
            : t,
        ),
      );
    } else {
      setActiveThreadId(optimisticId);
      setThreads((prev) => [
        {
          id: optimisticId,
          tenant_id: tenantId,
          company_id: companyId,
          title: TITLE_LOADING_PLACEHOLDER,
          created_at: nowIso,
          updated_at: nowIso,
          messages: msgs,
        },
        ...prev.filter((t) => t.id !== optimisticId),
      ]);
    }

    setSaving(true);
    try {
      const res = await api.chat.threads.save(tenantId, companyId, msgs, persistedThreadId);
      const saved = res.data;
      setActiveThreadId(saved.id);
      setThreads((prev) => {
        const filtered = prev.filter((t) => t.id !== optimisticId && t.id !== saved.id);
        return [saved, ...filtered];
      });
    } catch {
      if (!persistedThreadId) {
        setThreads((prev) => prev.filter((t) => t.id !== optimisticId));
        setActiveThreadId(null);
      }
      if (showSidebar) void loadThreads();
    } finally {
      setTitleLoadingIds((prev) => prev.filter((id) => id !== optimisticId));
      setSaving(false);
    }
  }, [api, tenantId, companyId, activeThreadId, showSidebar, loadThreads]);

  const sendMessage = async (userMsg: string) => {
    if (!tenantId || !companyId || !userMsg.trim() || streaming || inFlightRef.current) return;
    inFlightRef.current = true;

    const history: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
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
      const seenTools = new Set<string>();

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
              if (typeof event.name === "string" && !seenTools.has(event.name)) {
                seenTools.add(event.name);
                finalTools = [...finalTools, event.name];
                setStreamingTools((prev) => [...prev, event.name]);
              }
            } else if (event.type === "done") {
              if (Array.isArray(event.tools_used)) {
                finalTools = Array.from(new Set(event.tools_used.filter((t: unknown): t is string => typeof t === "string")));
              }
            } else if (event.type === "error") {
              toast.error(event.message ?? "AI error");
            }
          } catch {
            // malformed line
          }
        }
      }

      const finalMessages: ChatMessage[] = [...history, { role: "assistant", content: accText, tool_calls_made: finalTools }];
      setMessages(finalMessages);
      setStreaming(false);
      setStreamingText("");
      setStreamingTools([]);
      void saveThread(finalMessages);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reach AI CFO");
      setStreaming(false);
      setStreamingText("");
      setStreamingTools([]);
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleDeleteThread = async (thread: ChatThread) => {
    try {
      if (!isTempThreadId(thread.id)) {
        await api.chat.threads.delete(tenantId, companyId, thread.id);
      }
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
      setTitleLoadingIds((prev) => prev.filter((id) => id !== thread.id));
      if (activeThreadId === thread.id) {
        setMessages([]);
        setActiveThreadId(null);
      }
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleClearCurrent = async () => {
    if (activeThreadId) {
      try {
        if (!isTempThreadId(activeThreadId)) {
          await api.chat.threads.delete(tenantId, companyId, activeThreadId);
        }
        setThreads((prev) => prev.filter((t) => t.id !== activeThreadId));
        setTitleLoadingIds((prev) => prev.filter((id) => id !== activeThreadId));
      } catch {
        // ignore
      }
    }
    setMessages([]);
    setActiveThreadId(null);
    setStreamingText("");
  };

  const canSend = input.trim().length > 0 && !streaming;

  return (
    <div className="relative flex h-[calc(100vh-0px)] flex-col overflow-hidden bg-background">
      <Topbar title="AI CFO" />

      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="absolute inset-0 z-10 bg-black/25 backdrop-blur-[2px]"
            />
            <ThreadSidebar
              threads={threads}
              activeId={activeThreadId}
              titleLoadingIds={titleLoadingIds}
              onSelect={(thread) => {
                setActiveThreadId(thread.id);
                setMessages(thread.messages.map((m) => ({ role: m.role, content: m.content, tool_calls_made: m.tool_calls_made })));
                setShowSidebar(false);
              }}
              onDelete={handleDeleteThread}
              onNew={() => {
                setMessages([]);
                setActiveThreadId(null);
                setShowSidebar(false);
              }}
              onClose={() => setShowSidebar(false)}
            />
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5 px-4 py-7">
          {messages.length === 0 && !streaming ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Your AI CFO</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Ask anything about your business finances and get grounded answers from your synced Tally data.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.query}
                    onClick={() => void sendMessage(s.query)}
                    className="rounded-xl border border-border bg-secondary px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <MessageBubble key={`${msg.role}-${i}`} msg={msg} />
                ))}
              </AnimatePresence>

              {streaming && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                    <AICfoLogo tone="on-primary" className="h-4 w-4" />
                  </div>
                  <div className="flex max-w-[80%] flex-col gap-1.5">
                    {streamingTools.length > 0 && (
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <Database className="h-3 w-3 text-muted-foreground/60" />
                        {streamingTools.map((t, idx) => (
                          <span key={`${t}-${idx}`} className="rounded-full border border-border bg-secondary px-2 py-0.5 text-2xs font-medium text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                      {streamingText ? (
                        <p className="prose-chat whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                          {streamingText}
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:300ms]" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background/85 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3">
          {messages.length > 0 && messages.length < 4 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s.query}
                  onClick={() => void sendMessage(s.query)}
                  disabled={streaming}
                  className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2">
            <button
              onClick={() => setShowSidebar(true)}
              title="Conversation history"
              className="mb-1.5 rounded-xl p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <History className="h-4 w-4" />
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearCurrent}
                title="Delete this conversation"
                disabled={streaming}
                className="mb-1.5 rounded-xl p-2 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <div className="relative flex-1 rounded-2xl border border-border bg-card shadow-[0_0_0_1px_rgba(59,130,246,0.06)] transition-all focus-within:border-primary/35 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_0_24px_rgba(59,130,246,0.2)]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input.trim());
                  }
                }}
                placeholder="Ask anything about your business finances..."
                className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ minHeight: "2.8rem", maxHeight: "8.75rem" }}
              />

              <button
                onClick={() => void sendMessage(input.trim())}
                disabled={!canSend}
                className={cn(
                  "absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  canSend ? "bg-primary text-primary-foreground shadow-glow-primary hover:opacity-90 active:scale-95" : "bg-secondary text-muted-foreground",
                )}
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="text-center text-2xs text-muted-foreground/70">
            {saving ? (
              <span className="inline-flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving...</span>
            ) : (
              "AI CFO uses synced Tally data. Validate decisions before execution."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
