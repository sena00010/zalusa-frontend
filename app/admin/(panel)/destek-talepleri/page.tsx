"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TicketCheck, MessageSquare, Send, User, Clock, CheckCircle2,
  Loader2, AlertCircle, X, ChevronDown, Circle, Paperclip,
  FileText, ExternalLink, Headphones, Package, CreditCard,
  AlertTriangle, Filter,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ADMIN_TOKEN_KEY = "zalusa.admin.token";

function getAdminToken() {
  return typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
}
function adminHeaders(): Record<string, string> {
  const t = getAdminToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}
function formatSize(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  shipment: { label: "Gönderi", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Package },
  payment: { label: "Ödeme", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CreditCard },
  account: { label: "Hesap", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: User },
  technical: { label: "Teknik", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertCircle },
  other: { label: "Diğer", color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: MessageSquare },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Düşük", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
  medium: { label: "Normal", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  high: { label: "Yüksek", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  urgent: { label: "Acil", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open: { label: "Açık", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Circle },
  awaiting_reply: { label: "Yanıt Bekleniyor", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  in_progress: { label: "İşleniyor", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: Loader2 },
  resolved: { label: "Çözüldü", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  closed: { label: "Kapalı", color: "text-slate-500", bg: "bg-slate-100 border-slate-200", icon: X },
};

interface Ticket {
  id: number; ticketCode: string; userId: number; category: string; priority: string;
  subject: string; status: string; createdAt: string; updatedAt: string;
  userEmail: string; userName: string; messageCount: number;
}
interface TicketMessage { id: number; senderType: string; senderId: number; message: string; createdAt: string; }
interface TicketAttachment { id: number; fileName: string; fileUrl: string; fileSize: number; fileType: string; uploadedBy: string; createdAt: string; }
interface TicketDetail extends Ticket {
  messages: TicketMessage[]; attachments: TicketAttachment[];
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [statusDropdown, setStatusDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch tickets ────────────────────────────────────────────────
  const loadTickets = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/admin/support-tickets?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterCategory) url += `category=${filterCategory}&`;
      const res = await fetch(url, { headers: adminHeaders() });
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, [filterStatus, filterCategory]);

  useEffect(() => { loadTickets(); pollRef.current = setInterval(loadTickets, 10000); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, [loadTickets]);

  // ── Fetch ticket detail ──────────────────────────────────────────
  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-tickets/${id}`, { headers: adminHeaders() });
      const data = await res.json();
      setDetail(data.ticket ?? null);
    } catch { setDetail(null); }
    finally { setDetailLoading(false); }
  }, []);

  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [detail?.messages]);

  // ── Send reply ───────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      await fetch(`${API_BASE}/api/admin/support-tickets/${selectedId}/reply`, {
        method: "POST", headers: adminHeaders(), body: JSON.stringify({ message: replyText.trim() }),
      });
      setReplyText("");
      await loadDetail(selectedId);
      await loadTickets();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  // ── Update status ────────────────────────────────────────────────
  const updateStatus = async (newStatus: string) => {
    if (!selectedId) return;
    try {
      await fetch(`${API_BASE}/api/admin/support-tickets/${selectedId}/status`, {
        method: "PUT", headers: adminHeaders(), body: JSON.stringify({ status: newStatus }),
      });
      setStatusDropdown(false);
      await loadDetail(selectedId);
      await loadTickets();
    } catch { /* ignore */ }
  };

  const selectTicket = (id: number) => {
    setSelectedId(id);
    setReplyText("");
    setStatusDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  // ── Stats ────────────────────────────────────────────────────────
  const openCount = tickets.filter(t => t.status === "open").length;
  const awaitCount = tickets.filter(t => t.status === "awaiting_reply").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Destek Talepleri</h1>
        <p className="mt-1 text-sm text-slate-500">Kullanıcı destek taleplerini yönetin ve yanıtlayın</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2">
          <Circle className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">{openCount} Açık</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">{awaitCount} Yanıt Bekliyor</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">{resolvedCount} Çözüldü</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest self-center mr-1">Filtre:</span>
        {[{ key: "", label: "Tümü" }, { key: "open", label: "Açık" }, { key: "awaiting_reply", label: "Yanıt Bekliyor" }, { key: "in_progress", label: "İşleniyor" }, { key: "resolved", label: "Çözüldü" }, { key: "closed", label: "Kapalı" }].map(f => (
          <button key={f.key} onClick={() => { setFilterStatus(f.key); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${filterStatus === f.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Main container */}
      <div className="flex rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: 500 }}>
        {/* ── Left: Ticket List ── */}
        <div className="w-[340px] shrink-0 border-r border-slate-100 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">{tickets.length} Talep</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-50" />)}</div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <TicketCheck className="h-10 w-10 text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">Destek talebi bulunamadı</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {tickets.map(t => {
                  const st = STATUS_MAP[t.status] || STATUS_MAP.open;
                  const pri = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
                  const isSelected = selectedId === t.id;
                  const isOpen = t.status === "open";

                  return (
                    <button key={t.id} onClick={() => selectTicket(t.id)}
                      className={`w-full text-left rounded-xl px-3 py-3 transition-all duration-200 ${isSelected ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-slate-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${isOpen ? "bg-blue-100" : t.status === "awaiting_reply" ? "bg-amber-100" : "bg-slate-100"}`}>
                          <TicketCheck className={`h-4 w-4 ${isOpen ? "text-blue-600" : t.status === "awaiting_reply" ? "text-amber-600" : "text-slate-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-slate-800 truncate flex-1">{t.subject}</span>
                            {isOpen && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${st.bg} ${st.color}`}>{st.label}</span>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${pri.bg} ${pri.color}`}>{pri.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-1">
                            {t.userName || t.userEmail} • {t.ticketCode}
                          </p>
                          <span className="text-[10px] text-slate-300 block mt-0.5">{t.createdAt} • {t.messageCount} mesaj</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Detail ── */}
        <div className="flex-1 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-indigo-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Talep seçin</h3>
              <p className="text-sm text-slate-400 mt-1">Sol taraftan bir destek talebine tıklayarak detayları görüntüleyin</p>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>
          ) : !detail ? (
            <div className="flex-1 flex items-center justify-center"><p className="text-slate-400">Talep yüklenemedi</p></div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${detail.status === "open" ? "bg-blue-100" : detail.status === "awaiting_reply" ? "bg-amber-100" : "bg-slate-100"}`}>
                    <User className={`h-4 w-4 ${detail.status === "open" ? "text-blue-600" : detail.status === "awaiting_reply" ? "text-amber-600" : "text-slate-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{detail.subject}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-slate-400">{detail.userName || detail.userEmail}</span>
                      <span className="text-[11px] text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400 font-mono">{detail.ticketCode}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${(CATEGORY_MAP[detail.category] || CATEGORY_MAP.other).bg} ${(CATEGORY_MAP[detail.category] || CATEGORY_MAP.other).color}`}>
                        {(CATEGORY_MAP[detail.category] || CATEGORY_MAP.other).label}
                      </span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${(PRIORITY_MAP[detail.priority] || PRIORITY_MAP.medium).bg} ${(PRIORITY_MAP[detail.priority] || PRIORITY_MAP.medium).color}`}>
                        {(PRIORITY_MAP[detail.priority] || PRIORITY_MAP.medium).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status dropdown */}
                <div className="relative shrink-0">
                  <button onClick={() => setStatusDropdown(!statusDropdown)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${(STATUS_MAP[detail.status] || STATUS_MAP.open).bg} ${(STATUS_MAP[detail.status] || STATUS_MAP.open).color}`}>
                    {(STATUS_MAP[detail.status] || STATUS_MAP.open).label}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {statusDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                      {Object.entries(STATUS_MAP).map(([key, val]) => (
                        <button key={key} onClick={() => updateStatus(key)}
                          className={`w-full text-left px-3 py-2 text-[12px] font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 ${detail.status === key ? "text-indigo-600 bg-indigo-50" : "text-slate-700"}`}>
                          <val.icon className="h-3.5 w-3.5" />
                          {val.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments section */}
              {detail.attachments.length > 0 && (
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{detail.attachments.length} Dosya Eki</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {detail.attachments.map(a => {
                      const isImage = a.fileType.startsWith("image/");
                      const isPdf = a.fileType === "application/pdf";
                      return (
                        <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all shrink-0 group min-w-0 max-w-[220px]">
                          {isImage ? (
                            <img src={a.fileUrl} alt={a.fileName} className="h-9 w-9 rounded-lg object-cover shrink-0 border border-slate-100" />
                          ) : (
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? "bg-red-50" : "bg-indigo-50"}`}>
                              <FileText className={`h-4 w-4 ${isPdf ? "text-red-500" : "text-indigo-500"}`} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{a.fileName}</p>
                            <p className="text-[9px] text-slate-400">{formatSize(a.fileSize)} • {a.uploadedBy === "admin" ? "Admin" : "Kullanıcı"}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-indigo-400 shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: "#fafbff" }}>
                {detail.messages.map(msg => {
                  const isUser = msg.senderType === "user";
                  return (
                    <div key={msg.id} className={`flex gap-2.5 items-end ${isUser ? "" : "justify-end"}`}>
                      {isUser && (
                        <div className="h-7 w-7 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${isUser ? "bg-white rounded-bl-md border border-slate-100 text-slate-700" : "bg-indigo-600 rounded-br-md text-white"}`}>
                          {msg.message}
                        </div>
                        <span className={`text-[10px] text-slate-400 mt-0.5 block ${isUser ? "ml-1" : "mr-1 text-right"}`}>
                          {isUser ? (detail.userName || "Kullanıcı") : "Admin"} • {msg.createdAt}
                        </span>
                      </div>
                      {!isUser && (
                        <div className="h-7 w-7 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Headphones className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              {detail.status !== "closed" && detail.status !== "resolved" ? (
                <div className="px-5 py-3 border-t border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <input ref={inputRef} type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Kullanıcıya yanıt yazın..."
                      className="flex-1 h-10 px-4 rounded-xl bg-slate-50 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
                    <button onClick={sendReply} disabled={!replyText.trim() || sending}
                      className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 hover:shadow-md active:scale-95 bg-indigo-600 disabled:bg-slate-200">
                      {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className={`h-4 w-4 ${replyText.trim() ? "text-white" : "text-slate-400"}`} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 border-t border-slate-100 text-center shrink-0">
                  <p className="text-[12px] font-bold text-slate-400">Bu talep {detail.status === "closed" ? "kapatılmış" : "çözülmüş"}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
