"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Headphones,
  MessageCircle,
  X,
  Send,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  adminService,
  type LiveChat,
  type LiveChatMessage,
} from "@/lib/services/adminService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_BASE = API_BASE.replace(/^http/, "ws");
const ADMIN_TOKEN_KEY = "zalusa.admin.token";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  waiting: {
    label: "Bekliyor",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Clock,
  },
  active: {
    label: "Aktif",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
  closed: {
    label: "Kapatılmış",
    color: "bg-slate-100 text-slate-500 border-slate-200",
    icon: X,
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  return `${Math.floor(hrs / 24)} gün önce`;
}

// ─── Bildirim sesi (Web Audio API) ─────────────────────────────────────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // İlk ton (yüksek)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // İkinci ton (daha yüksek)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1174;
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);

    // Cleanup
    setTimeout(() => ctx.close(), 500);
  } catch {
    // AudioContext desteklemiyorsa sessizce atla
  }
}

export default function LiveSupportPage() {
  const [chats, setChats] = useState<LiveChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevChatCountRef = useRef<number>(0);

  // ─── Load chats ────────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    try {
      const data = await adminService.listLiveChats();
      const newChats = Array.isArray(data?.chats) ? data.chats : [];
      // Yeni bekleyen chat geldi mi kontrol et
      const waitingNow = newChats.filter((c) => c.status === "waiting").length;
      if (prevChatCountRef.current > 0 && waitingNow > prevChatCountRef.current) {
        playNotificationSound();
      }
      prevChatCountRef.current = waitingNow;
      setChats(newChats);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    // Periyodik güncelleme
    pollRef.current = setInterval(loadChats, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadChats]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Select a chat & connect WebSocket ─────────────────────────────
  const selectChat = useCallback(
    async (chatId: number) => {
      // Close existing WS
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      setSelectedChatId(chatId);
      setMessages([]);
      setConnecting(true);

      // Load existing messages
      try {
        const data = await adminService.getLiveChatMessages(chatId);
        if (Array.isArray(data?.messages)) {
          setMessages(data.messages);
        }
      } catch {
        /* ignore */
      }

      // Connect WebSocket
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setConnecting(false);
        return;
      }

      const ws = new WebSocket(
        `${WS_BASE}/api/admin/live-support/ws?token=${token}&chat_id=${chatId}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setConnecting(false);
        console.log("[Admin LiveSupport] WebSocket bağlandı");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "chat_history") {
            // Geçmiş zaten REST ile yüklendi, atla
            return;
          }

          if (data.type === "message" && data.sender === "user") {
            playNotificationSound();
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                chatId: chatId,
                sender: "user",
                content: data.content,
                createdAt: new Date().toISOString(),
              },
            ]);
          }

          if (data.type === "chat_closed") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                chatId: chatId,
                sender: "system",
                content: "Sohbet kapatıldı.",
                createdAt: new Date().toISOString(),
              },
            ]);
            loadChats();
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        console.log("[Admin LiveSupport] WebSocket kapandı");
      };

      ws.onerror = () => {
        setConnecting(false);
      };

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 300);
    },
    [loadChats]
  );

  // ─── Send message ──────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!input.trim() || !wsRef.current || !selectedChatId) return;

    wsRef.current.send(
      JSON.stringify({ type: "message", content: input.trim() })
    );

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        chatId: selectedChatId,
        sender: "admin",
        content: input.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  }, [input, selectedChatId]);

  // ─── Close chat ────────────────────────────────────────────────────
  const closeChat = useCallback(
    async (chatId: number) => {
      try {
        await adminService.closeLiveChat(chatId);
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
          setMessages([]);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
        loadChats();
      } catch {
        /* ignore */
      }
    },
    [selectedChatId, loadChats]
  );

  // ─── Cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const waitingCount = chats.filter((c) => c.status === "waiting").length;
  const activeCount = chats.filter((c) => c.status === "active").length;

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Canlı Destek</h1>
        <p className="mt-1 text-sm text-slate-500">
          Müşterilerle gerçek zamanlı sohbet edin
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">
            {waitingCount} Bekleyen
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">
            {activeCount} Aktif
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: 500 }}>
        {/* ── Left: Chat List ── */}
        <div className="w-[320px] shrink-0 border-r border-slate-100 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Destek Talepleri
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Headphones className="h-10 w-10 text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">
                  Aktif destek talebi yok
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chats.map((chat) => {
                  const config = statusConfig[chat.status] || statusConfig.waiting;
                  const StatusIcon = config.icon;
                  const isSelected = selectedChatId === chat.id;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`w-full text-left rounded-xl px-3 py-3 transition-all duration-200 ${
                        isSelected
                          ? "bg-indigo-50 ring-1 ring-indigo-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
                            chat.status === "waiting"
                              ? "bg-amber-100"
                              : "bg-emerald-100"
                          }`}
                        >
                          <User
                            className={`h-4 w-4 ${
                              chat.status === "waiting"
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-slate-800 truncate">
                              {chat.userName}
                            </span>
                            <span
                              className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {chat.lastMessage || "Henüz mesaj yok"}
                          </p>
                          <span className="text-[10px] text-slate-300 mt-0.5 block">
                            {timeAgo(chat.createdAt)} •{" "}
                            {chat.messageCount} mesaj
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat Area ── */}
        <div className="flex-1 flex flex-col">
          {!selectedChatId ? (
            /* No chat selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-indigo-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">
                Sohbet seçin
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Sol taraftan bir destek talebine tıklayarak sohbete başlayın
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${
                      selectedChat?.status === "waiting"
                        ? "bg-amber-100"
                        : "bg-emerald-100"
                    }`}
                  >
                    <User
                      className={`h-4 w-4 ${
                        selectedChat?.status === "waiting"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {selectedChat?.userName || "Kullanıcı"}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      #{selectedChatId} •{" "}
                      {selectedChat?.status === "active"
                        ? "🟢 Aktif sohbet"
                        : "⏳ Bağlanılıyor..."}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => closeChat(selectedChatId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Sohbeti Kapat
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: "#fafbff" }}>
                {connecting && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200">
                      <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                      <span className="text-[12px] font-medium text-indigo-700">
                        Bağlanılıyor...
                      </span>
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  if (msg.sender === "system") {
                    return (
                      <div
                        key={msg.id}
                        className="flex justify-center"
                      >
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-500 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  const isUser = msg.sender === "user";

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 items-end ${
                        isUser ? "" : "justify-end"
                      }`}
                    >
                      {isUser && (
                        <div className="h-7 w-7 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                            isUser
                              ? "bg-white rounded-bl-md border border-slate-100 text-slate-700"
                              : "bg-indigo-600 rounded-br-md text-white"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span
                          className={`text-[10px] text-slate-400 mt-0.5 block ${
                            isUser ? "ml-1" : "mr-1 text-right"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString(
                            "tr-TR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-3 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Müşteriye yanıt yazın..."
                    className="flex-1 h-10 px-4 rounded-xl bg-slate-50 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 hover:shadow-md active:scale-95 bg-indigo-600 disabled:bg-slate-200"
                  >
                    <Send
                      className={`h-4 w-4 ${
                        input.trim() ? "text-white" : "text-slate-400"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
