"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, Loader2, Headphones, Package, MapPin,
  RotateCcw, Search, Truck, CheckCircle2, AlertTriangle, Clock,
  CreditCard, Tag, ArrowLeft, User, Plus, Paperclip, X,
  MessageSquare, TicketCheck, ChevronRight, FileText, Upload,
  AlertCircle, CheckCircle, Circle, Filter
} from "lucide-react";
import ShipmentWizard from "@/components/ShipmentWizard";

const ASSISTANT_NAME = "Destek Asistanı";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_BASE = API_BASE.replace(/^http/, "ws");

const quickActions = [
  { id: "cargo_create", label: "Kargo Oluştur", icon: Package },
  { id: "cargo_track", label: "Kargo Takip", icon: MapPin },
  { id: "live_support", label: "Canlı Destek", icon: Headphones },
];

type ChatMode = "ai" | "waiting" | "live" | "shipment" | "tracking";
type MainView = "tickets" | "chat";

const CATEGORY_MAP: Record<string, { label: string; color: string; dotClass: string }> = {
  shipment: { label: "GÖNDERİ", color: "bg-blue-50 text-blue-600", dotClass: "bg-blue-500" },
  payment: { label: "ÖDEME", color: "bg-emerald-50 text-emerald-600", dotClass: "bg-emerald-500" },
  account: { label: "HESAP", color: "bg-violet-50 text-violet-600", dotClass: "bg-violet-500" },
  technical: { label: "TEKNİK", color: "bg-orange-50 text-orange-600", dotClass: "bg-orange-500" },
  other: { label: "DİĞER", color: "bg-slate-100 text-slate-600", dotClass: "bg-slate-400" },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; dotClass: string }> = {
  low: { label: "DÜŞÜK", color: "bg-slate-100 text-slate-600", dotClass: "bg-slate-400" },
  medium: { label: "NORMAL", color: "bg-blue-50 text-blue-600", dotClass: "bg-blue-500" },
  high: { label: "YÜKSEK", color: "bg-amber-50 text-amber-600", dotClass: "bg-amber-500" },
  urgent: { label: "ACİL", color: "bg-red-50 text-red-600", dotClass: "bg-red-500" },
};

const STATUS_MAP: Record<string, { label: string; color: string; dotClass: string }> = {
  open: { label: "AÇIK", color: "bg-blue-50 text-blue-600", dotClass: "bg-blue-500" },
  awaiting_reply: { label: "YANIT BEKLİYOR", color: "bg-amber-50 text-amber-600", dotClass: "bg-amber-500" },
  in_progress: { label: "İŞLENİYOR", color: "bg-violet-50 text-violet-600", dotClass: "bg-violet-500" },
  resolved: { label: "ÇÖZÜLDÜ", color: "bg-[#ECFDF5] text-[#10B981]", dotClass: "bg-[#10B981]" },
  closed: { label: "KAPALI", color: "bg-slate-100 text-slate-500", dotClass: "bg-slate-400" },
};

interface Ticket {
  id: number; ticketCode: string; category: string; priority: string;
  subject: string; status: string; createdAt: string; updatedAt: string;
  messageCount: number; adminReplyCount: number; lastMessageAt: string;
}
interface TicketMessage { id: number; senderType: string; senderId: number; message: string; createdAt: string; }
interface TicketAttachment { id: number; fileName: string; fileUrl: string; fileSize: number; fileType: string; uploadedBy: string; createdAt: string; }
interface TicketDetail {
  id: number; ticketCode: string; category: string; priority: string;
  subject: string; status: string; createdAt: string; updatedAt: string;
  messages: TicketMessage[]; attachments: TicketAttachment[];
}

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("zalusa.token") : null; }
function authHeaders(): Record<string, string> {
  const t = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}
function formatSize(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; color: string; dotClass: string }> }) {
  const st = map[status] || { label: status, color: "bg-slate-100 text-slate-600", dotClass: "bg-slate-400" };
  return (
    <span className={`${st.color} px-2.5 py-1 rounded-[8px] text-[11px] font-bold tracking-wide flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`}></span>
      {st.label}
    </span>
  );
}

/* ═══════════════════ TICKET LIST ═══════════════════ */
function TicketListView({ onSelectTicket, onNewTicket }: { onSelectTicket: (id: number) => void; onNewTicket: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/support-tickets`, { headers: authHeaders() });
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const TABS = [
    { key: "", label: "Tümü" },
    { key: "open", label: "Açık" },
    { key: "awaiting_reply", label: "Yanıt Bekliyor" },
    { key: "resolved", label: "Çözüldü" },
    { key: "closed", label: "Kapalı" },
  ];

  const filtered = filterStatus ? tickets.filter(t => t.status === filterStatus) : tickets;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Destek Taleplerim</h1>
          <p className="text-[13px] text-slate-500">Tüm destek taleplerinizi buradan takip edebilirsiniz.</p>
        </div>
        <button onClick={onNewTicket}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold transition-all shadow-sm">
          <Plus className="h-4 w-4" /> Yeni Talep
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
        {TABS.map(tab => {
          const isActive = filterStatus === tab.key;
          const count = tab.key === "" ? tickets.length : tickets.filter(t => t.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold rounded-[10px] border transition-all ${isActive ? "bg-white border-slate-200 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
              <span className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-bold rounded-[6px] ${isActive ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-400 shadow-sm"}`}>
                {count}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-[72px] animate-pulse rounded-[16px] bg-white border border-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-dashed border-slate-200 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mx-auto">
            <TicketCheck className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold text-slate-700">Henüz destek talebiniz yok</h3>
          <p className="mt-1 text-[13px] text-slate-400">Yeni bir talep oluşturarak başlayabilirsiniz.</p>
          <button onClick={onNewTicket}
            className="mt-5 px-6 py-2.5 rounded-full bg-[#2563EB] text-white text-[13px] font-bold hover:bg-[#1D4ED8] transition-all shadow-sm">
            Yeni Talep Oluştur
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(t => {
            const st = STATUS_MAP[t.status] || STATUS_MAP.open;
            const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.other;
            const hasNewReply = t.adminReplyCount > 0 && t.status === "awaiting_reply";
            return (
              <button key={t.id} onClick={() => onSelectTicket(t.id)}
                className={`w-full text-left bg-white rounded-[16px] border p-4 transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] group ${hasNewReply ? "border-[#2563EB]/30 ring-1 ring-[#2563EB]/10" : "border-slate-200"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-slate-900 truncate">{t.subject}</p>
                      {hasNewReply && <span className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={t.status} map={STATUS_MAP} />
                      <StatusBadge status={t.category} map={CATEGORY_MAP} />
                      <StatusBadge status={t.priority} map={PRIORITY_MAP} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                      <span className="font-bold text-slate-500">{t.ticketCode}</span>
                      <span>•</span>
                      <span>{t.createdAt}</span>
                      <span>•</span>
                      <span>{t.messageCount} mesaj</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#2563EB] transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ NEW TICKET FORM ═══════════════════ */
function NewTicketForm({ onBack, onCreated }: { onBack: () => void; onCreated: (id: number) => void }) {
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter(f => {
      if (f.size > 10 * 1024 * 1024) { setError(`"${f.name}" 10MB sınırını aşıyor`); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...valid]);
  };
  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { setError("Konu ve mesaj zorunludur"); return; }
    setSending(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/support-tickets`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ category, priority, subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Bir hata oluştu"); setSending(false); return; }
      const ticketId = data.id;
      if (files.length > 0) {
        const token = getToken();
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Dosya yükleniyor (${i + 1}/${files.length})...`);
          const fd = new FormData(); fd.append("file", files[i]);
          try { await fetch(`${API_BASE}/api/support-tickets/${ticketId}/attachments`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd }); } catch {}
        }
      }
      onCreated(ticketId);
    } catch { setError("Bağlantı hatası"); }
    finally { setSending(false); setUploadProgress(""); }
  };

  const categories = [
    { key: "shipment", label: "Gönderi", icon: Package },
    { key: "payment", label: "Ödeme", icon: CreditCard },
    { key: "account", label: "Hesap", icon: User },
    { key: "technical", label: "Teknik", icon: AlertCircle },
    { key: "other", label: "Diğer", icon: MessageSquare },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-[40px] w-[40px] rounded-[12px] bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Yeni Destek Talebi</h1>
          <p className="text-[13px] text-slate-500">Sorununuzu detaylı açıklayarak bize iletin</p>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-slate-200 p-5 space-y-5">
        {/* Category + Priority row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => {
                const Icon = c.icon;
                return (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold border transition-all ${category === c.key ? "bg-[#2563EB] border-[#2563EB] text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    <Icon className="h-3.5 w-3.5" /> {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Öncelik</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <button key={k} onClick={() => setPriority(k)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold border transition-all ${priority === k ? "bg-[#2563EB] border-[#2563EB] text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Konu</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Destek talebinizin konusunu yazın..."
            className="w-full h-[44px] px-4 rounded-[12px] border border-slate-200 bg-white text-[14px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
        </div>

        {/* Message */}
        <div>
          <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Mesajınız</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Sorununuzu detaylı şekilde açıklayın..." rows={4}
            className="w-full px-4 py-3 rounded-[12px] border border-slate-200 bg-white text-[14px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" />
        </div>

        {/* File Upload */}
        <div>
          <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Dosya Ekle</label>
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
          <button onClick={() => fileInputRef.current?.click()} type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border border-dashed border-slate-300 bg-slate-50/50 hover:border-[#2563EB] hover:bg-blue-50/30 transition-all group cursor-pointer">
            <Upload className="h-4 w-4 text-slate-400 group-hover:text-[#2563EB]" />
            <span className="text-[13px] font-medium text-slate-500 group-hover:text-[#2563EB]">PDF, Görsel, Word, Excel, ZIP — Maks. 10MB</span>
          </button>
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 text-[12px]">
                  <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span className="font-semibold text-slate-700 max-w-[120px] truncate">{f.name}</span>
                  <span className="text-slate-400">{formatSize(f.size)}</span>
                  <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-400 transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-red-50 border border-red-200 text-[13px] font-medium text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={sending || !subject.trim() || !message.trim()}
          className="w-full py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> {uploadProgress || "Gönderiliyor..."}</> : <><Send className="h-4 w-4" /> Talep Gönder {files.length > 0 ? `(${files.length} dosya)` : ""}</>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════ TICKET DETAIL ═══════════════════ */
function TicketDetailView({ ticketId, onBack }: { ticketId: number; onBack: () => void }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/support-tickets/${ticketId}`, { headers: authHeaders() });
      const data = await res.json();
      setTicket(data.ticket ?? null);
    } catch {}
    finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticket?.messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${API_BASE}/api/support-tickets/${ticketId}/messages`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ message: newMsg.trim() }) });
      setNewMsg(""); await fetchTicket();
    } catch {} finally { setSending(false); }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const token = getToken();
      await fetch(`${API_BASE}/api/support-tickets/${ticketId}/attachments`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      await fetchTicket();
    } catch {} finally { setUploading(false); }
  };

  const closeTicket = async () => {
    setClosing(true);
    try { await fetch(`${API_BASE}/api/support-tickets/${ticketId}/close`, { method: "PUT", headers: authHeaders() }); await fetchTicket(); } catch {} finally { setClosing(false); setShowCloseModal(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-[#2563EB] animate-spin" /></div>;
  if (!ticket) return <div className="flex items-center justify-center py-20"><p className="text-slate-500">Talep bulunamadı</p></div>;

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="h-[40px] w-[40px] rounded-[12px] bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm shrink-0">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-tight text-slate-900 truncate">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[12px] font-bold text-slate-400">{ticket.ticketCode}</span>
              <StatusBadge status={ticket.status} map={STATUS_MAP} />
              <StatusBadge status={ticket.category} map={CATEGORY_MAP} />
            </div>
          </div>
        </div>
        {!isClosed && (
          <button onClick={() => setShowCloseModal(true)} disabled={closing}
            className="text-[12px] font-semibold text-red-500 px-3 py-1.5 rounded-[8px] hover:bg-red-50 border border-red-200 transition-colors shrink-0">
            {closing ? "..." : "Talebi Kapat"}
          </button>
        )}
      </div>

      {/* Attachments */}
      {ticket.attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {ticket.attachments.map(a => (
            <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shrink-0">
              <FileText className="h-3.5 w-3.5" />
              <span className="max-w-[100px] truncate">{a.fileName}</span>
              <span className="text-slate-400">{formatSize(a.fileSize)}</span>
            </a>
          ))}
        </div>
      )}

      {/* Close ticket modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-[16px] bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Talebi Kapat</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-600 mb-5">Bu destek talebini kapatmak istediğinize emin misiniz? Kapatıldıktan sonra mesaj gönderemezsiniz.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Vazgeç</button>
              <button onClick={closeTicket} disabled={closing} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {closing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Evet, Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="bg-white rounded-[16px] border border-slate-200 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 300px)", minHeight: 400 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-3" style={{ background: "#fafbff" }}>
          {ticket.messages.map(m => (
            <div key={m.id} className={`flex gap-2.5 ${m.senderType === "user" ? "justify-end" : "items-end"}`}>
              {m.senderType === "admin" && (
                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center"><Headphones className="h-3.5 w-3.5 text-white" /></div>
              )}
              <div className="max-w-[75%] min-w-0">
                <div className={`rounded-[14px] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${m.senderType === "user" ? "rounded-br-md bg-[#2563EB] text-white" : "rounded-bl-md bg-white border border-slate-100 text-slate-700"}`} style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                  {m.message}
                </div>
                <span className={`text-[10px] font-medium mt-1 block text-slate-400 ${m.senderType === "user" ? "text-right mr-1" : "ml-1"}`}>
                  {m.senderType === "admin" ? "Destek Ekibi • " : ""}{m.createdAt}
                </span>
              </div>
            </div>
          ))}
          <div ref={msgsEndRef} />
        </div>

        {/* Input */}
        {!isClosed ? (
          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Mesajınızı yazın..."
                className="flex-1 h-[40px] px-4 rounded-[10px] bg-slate-50 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" />
              <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-[40px] w-[40px] rounded-[10px] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#2563EB] hover:border-[#2563EB] transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                className="h-[40px] w-[40px] rounded-[10px] flex items-center justify-center transition-all disabled:opacity-40 bg-[#2563EB] disabled:bg-slate-200 hover:bg-[#1D4ED8]">
                {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className={`h-4 w-4 ${newMsg.trim() ? "text-white" : "text-slate-400"}`} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-slate-100 text-center">
            <p className="text-[12px] font-semibold text-slate-400">Bu talep kapatılmıştır</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function DestekTalebiPage() {
  const [mainView, setMainView] = useState<MainView>("tickets");
  const [ticketSubView, setTicketSubView] = useState<"list" | "new" | "detail">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Chat state (preserved from original)
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", type: "text", content: `Merhaba! 👋\nBen **${ASSISTANT_NAME}**.\n\nSize nasıl yardımcı olabilirim?`, timestamp: new Date() },
    { id: "quick", role: "assistant", type: "quick_actions", content: "", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (mainView === "chat") setTimeout(() => inputRef.current?.focus(), 300); }, [mainView]);
  useEffect(() => { return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } }; }, []);

  const connectLiveSupport = useCallback(() => {
    const token = getToken();
    if (!token) { setMessages(p => [...p, { id: `sys-${Date.now()}`, role: "assistant", type: "text", content: "⚠️ Canlı destek için giriş yapmanız gerekiyor.", timestamp: new Date() }]); return; }
    setChatMode("waiting");
    setMessages(p => [...p, { id: `sys-w-${Date.now()}`, role: "assistant", type: "text", content: "🔄 Müşteri temsilcisine bağlanılıyor...", timestamp: new Date() }]);
    const ws = new WebSocket(`${WS_BASE}/api/live-support/ws?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (event) => { try { const data = JSON.parse(event.data); if (data.type === "agent_joined") { setChatMode("live"); setMessages(p => [...p, { id: `j-${Date.now()}`, role: "assistant", type: "text", content: `✅ ${data.content || "Temsilci bağlandı."}`, timestamp: new Date() }]); } else if (data.type === "message" && data.sender === "admin") { setMessages(p => [...p, { id: `la-${Date.now()}`, role: "assistant", type: "text", content: data.content, timestamp: new Date() }]); } else if (data.type === "chat_closed") { setChatMode("ai"); setMessages(p => [...p, { id: `cl-${Date.now()}`, role: "assistant", type: "text", content: "✅ Sohbet sonlandırıldı.", timestamp: new Date() }]); wsRef.current?.close(); wsRef.current = null; } } catch {} };
    ws.onclose = () => { setChatMode("ai"); wsRef.current = null; };
    ws.onerror = () => { setMessages(p => [...p, { id: `e-${Date.now()}`, role: "assistant", type: "text", content: "❌ Bağlantı kurulamadı.", timestamp: new Date() }]); setChatMode("ai"); wsRef.current = null; };
  }, []);

  const sendLiveMessage = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current) return;
    setMessages(p => [...p, { id: `ul-${Date.now()}`, role: "user", type: "text", content: text.trim(), timestamp: new Date() }]);
    setInput(""); wsRef.current.send(JSON.stringify({ type: "message", content: text.trim() }));
  }, []);

  const backToAI = useCallback(() => { wsRef.current?.close(); wsRef.current = null; setChatMode("ai"); setMessages(p => [...p, { id: `ba-${Date.now()}`, role: "assistant", type: "text", content: "🤖 AI Asistana geri dönüldü.", timestamp: new Date() }]); }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (chatMode === "live") { sendLiveMessage(text); return; }
    if (chatMode === "waiting") return;
    setMessages(p => [...p, { id: `u-${Date.now()}`, role: "user", type: "text", content: text.trim(), timestamp: new Date() }]);
    setInput(""); setIsTyping(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ message: text.trim(), history: messages.filter(m => m.type === "text").map(m => ({ role: m.role, content: m.content })) }) });
      const data = await res.json();
      setMessages(p => [...p, { id: `b-${Date.now()}`, role: "assistant", type: "text", content: data.reply || "Üzgünüm, bir hata oluştu.", timestamp: new Date() }]);
      if (data.action === "open_live_support") setTimeout(() => connectLiveSupport(), 500);
    } catch { setMessages(p => [...p, { id: `b-${Date.now()}`, role: "assistant", type: "text", content: "Bağlantı kurulamıyor.", timestamp: new Date() }]); }
    finally { setIsTyping(false); }
  }, [messages, chatMode, sendLiveMessage, connectLiveSupport]);

  const handleTrackShipment = useCallback(async (code: string) => {
    if (!code.trim()) return; setTrackingLoading(true); setTrackingError(null); setTrackingResult(null);
    try { const res = await fetch(`${API_BASE}/api/shipments/track/${encodeURIComponent(code.trim())}`); const data = await res.json(); if (!res.ok || data.found === false) setTrackingError(data.error || "Kargo bulunamadı."); else setTrackingResult(data); }
    catch { setTrackingError("Bağlantı hatası."); } finally { setTrackingLoading(false); }
  }, []);

  const handleQuickAction = (id: string) => {
    if (id === "cargo_create") setChatMode("shipment");
    else if (id === "cargo_track") { setChatMode("tracking"); setTrackingInput(""); setTrackingResult(null); setTrackingError(null); const t = getToken(); if (t) { setRecentLoading(true); fetch(`${API_BASE}/api/shipments/recent`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => setRecentShipments(d.shipments ?? [])).catch(() => setRecentShipments([])).finally(() => setRecentLoading(false)); } }
    else if (id === "live_support") connectLiveSupport();
  };

  const resetChat = () => { wsRef.current?.close(); wsRef.current = null; setChatMode("ai"); setMessages([{ id: "welcome", role: "assistant", type: "text", content: `Merhaba! 👋\nBen **${ASSISTANT_NAME}**.\n\nSize nasıl yardımcı olabilirim?`, timestamp: new Date() }, { id: "quick", role: "assistant", type: "quick_actions", content: "", timestamp: new Date() }]); };

  const renderContent = (text: string) => text.split("\n").map((line: string, i: number) => (
    <span key={i}>{line.split(/(\*\*.*?\*\*)/).map((part: string, j: number) => part.startsWith("**") && part.endsWith("**") ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong> : part)}{i < text.split("\n").length - 1 && <br />}</span>
  ));

  const headerGradient = chatMode === "live" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : chatMode === "waiting" ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : chatMode === "tracking" ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)";
  const HeaderIcon = chatMode === "tracking" ? Search : chatMode === "shipment" ? Package : chatMode === "ai" ? Bot : Headphones;

  return (
    <div className="space-y-0 pb-10">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 mb-6">
        {[
          { key: "tickets" as MainView, label: "Destek Taleplerim", icon: TicketCheck },
          { key: "chat" as MainView, label: "AI Asistan & Canlı Destek", icon: Bot },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => { setMainView(tab.key); if (tab.key === "tickets") setTicketSubView("list"); }}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all ${mainView === tab.key ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Ticket Views */}
      {mainView === "tickets" && (
        <>
          {ticketSubView === "list" && <TicketListView onSelectTicket={id => { setSelectedTicketId(id); setTicketSubView("detail"); }} onNewTicket={() => setTicketSubView("new")} />}
          {ticketSubView === "new" && <NewTicketForm onBack={() => setTicketSubView("list")} onCreated={id => { setSelectedTicketId(id); setTicketSubView("detail"); }} />}
          {ticketSubView === "detail" && selectedTicketId && <TicketDetailView ticketId={selectedTicketId} onBack={() => setTicketSubView("list")} />}
        </>
      )}

      {/* Chat View */}
      {mainView === "chat" && (
        <div className="bg-white rounded-[16px] border border-slate-200 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
          {/* Chat Header */}
          <div className="relative px-5 py-3 flex items-center gap-3 shrink-0" style={{ background: headerGradient }}>
            <div className="flex items-center gap-3 flex-1">
              {chatMode !== "ai" && <button onClick={backToAI} className="h-8 w-8 rounded-[8px] bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"><ArrowLeft className="h-4 w-4 text-white" /></button>}
              <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20"><HeaderIcon className="h-4 w-4 text-white" /></div>
              <div><h3 className="text-[14px] font-bold text-white">{chatMode === "live" ? "Canlı Destek" : chatMode === "waiting" ? "Bağlanılıyor..." : chatMode === "tracking" ? "Kargo Takip" : chatMode === "shipment" ? "Kargo Oluştur" : ASSISTANT_NAME}</h3></div>
            </div>
            <button onClick={resetChat} className="h-8 w-8 rounded-[8px] bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><RotateCcw className="h-4 w-4 text-white" /></button>
          </div>

          {chatMode === "shipment" ? (
            <ShipmentWizard onClose={() => setChatMode("ai")} onComplete={(tc: string, cost: number) => { setChatMode("ai"); setMessages(p => [...p, { id: `sh-${Date.now()}`, role: "assistant", type: "text", content: `🎉 Kargo oluşturuldu!\n\n📦 **Takip:** ${tc}\n💰 **Toplam:** ${cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`, timestamp: new Date() }]); }} />
          ) : chatMode === "tracking" ? (
            <div className="flex-1 overflow-y-auto px-5 py-5" style={{ background: "#fafbff" }}>
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="bg-white rounded-[14px] p-4 border border-slate-100">
                  <p className="text-[13px] text-slate-700 font-semibold mb-2">Takip kodunuzu girin</p>
                  <div className="flex gap-2">
                    <input type="text" value={trackingInput} onChange={e => setTrackingInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleTrackShipment(trackingInput); }} placeholder="ZLS-SHP-498101" className="flex-1 h-10 px-4 rounded-[10px] bg-slate-50 border border-slate-200 text-[13px] font-medium outline-none focus:border-violet-400" autoFocus />
                    <button onClick={() => handleTrackShipment(trackingInput)} disabled={!trackingInput.trim() || trackingLoading} className="h-10 px-4 rounded-[10px] text-[13px] font-bold text-white disabled:opacity-40 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
                      {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Sorgula</>}
                    </button>
                  </div>
                </div>
                {trackingError && <div className="bg-white rounded-[14px] p-4 border border-red-100"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500" /><p className="text-[13px] font-semibold text-red-600">{trackingError}</p></div></div>}
                {trackingResult && <div className="bg-white rounded-[14px] p-4 border border-slate-100"><p className="text-[13px] font-semibold text-emerald-600">✅ {trackingResult.statusLabel} — {trackingResult.trackingCode}</p></div>}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#fafbff" }}>
                <div className="max-w-3xl mx-auto space-y-2.5">
                  {messages.map(msg => {
                    if (msg.type === "quick_actions") return (
                      <div key={msg.id} className="flex flex-wrap gap-2 pl-10 pt-1">
                        {quickActions.map(a => { const I = a.icon; return <button key={a.id} onClick={() => handleQuickAction(a.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-[12px] font-semibold bg-white text-slate-700 border border-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] transition-all"><I className="h-3.5 w-3.5" />{a.label}</button>; })}
                      </div>
                    );
                    if (msg.role === "assistant") return (
                      <div key={msg.id} className="flex gap-2 items-end">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#2563EB] to-blue-500 flex items-center justify-center border-2 border-white shadow-sm"><Bot className="h-3.5 w-3.5 text-white" /></div>
                        <div className="max-w-[75%]"><div className="bg-white rounded-[14px] rounded-bl-md px-4 py-2.5 border border-slate-100"><p className="text-[13px] text-slate-700 leading-relaxed">{renderContent(msg.content)}</p></div><span className="text-[10px] font-medium text-slate-400 mt-0.5 ml-1 block">{msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                      </div>
                    );
                    return (
                      <div key={msg.id} className="flex gap-2 items-end justify-end">
                        <div className="max-w-[75%]"><div className="rounded-[14px] rounded-br-md px-4 py-2.5" style={{ background: chatMode === "live" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}><p className="text-[13px] text-white leading-relaxed font-medium">{msg.content}</p></div><span className="text-[10px] font-medium text-slate-400 mt-0.5 mr-1 block text-right">{msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                      </div>
                    );
                  })}
                  {isTyping && <div className="flex gap-2 items-end"><div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#2563EB] to-blue-500 flex items-center justify-center border-2 border-white"><Bot className="h-3.5 w-3.5 text-white" /></div><div className="bg-white rounded-[14px] rounded-bl-md px-4 py-2.5 border border-slate-100 flex items-center h-9"><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: "0ms" }} /><span className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: "150ms" }} /><span className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: "300ms" }} /></div></div></div>}
                  {chatMode === "waiting" && <div className="flex justify-center py-3"><div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200"><Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" /><span className="text-[11px] font-bold text-amber-700">Temsilci bekleniyor...</span></div></div>}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </div>
              <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                  <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                    placeholder={chatMode === "waiting" ? "Temsilci bekleniyor..." : chatMode === "live" ? "Temsilciye yazın..." : "Mesajınızı yazın..."}
                    disabled={chatMode === "waiting"} className="flex-1 h-[40px] px-4 rounded-[10px] bg-slate-50 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all disabled:opacity-50" />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping || chatMode === "waiting"}
                    className="h-[40px] w-[40px] shrink-0 rounded-[10px] flex items-center justify-center transition-all disabled:opacity-40 bg-[#2563EB] disabled:bg-slate-200 hover:bg-[#1D4ED8]">
                    {isTyping ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className={`h-4 w-4 ${input.trim() ? "text-white" : "text-slate-400"}`} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
