"use client";

import React from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import {
  adminService,
  type ShipmentDescriptionType,
} from "@/lib/services/adminService";

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[fadeInUp_0.3s_ease] max-w-sm">
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg ring-1 ${
          type === "success"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-red-50 text-red-700 ring-red-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  label,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  busy: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Tipi Sil</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          <span className="font-semibold">&ldquo;{label}&rdquo;</span> tipi kalıcı olarak silinecek. Emin misin?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {busy ? "Siliniyor..." : "Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShipmentDescriptionTypesPage() {
  const [types, setTypes] = React.useState<ShipmentDescriptionType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Create modal state
  const [showCreate, setShowCreate] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({ label: "", sortOrder: "" });
  const [createBusy, setCreateBusy] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // ── Edit modal state
  const [editItem, setEditItem] = React.useState<ShipmentDescriptionType | null>(null);
  const [editForm, setEditForm] = React.useState({ label: "", sortOrder: "", isActive: true });
  const [editBusy, setEditBusy] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // ── Delete modal state
  const [deleteItem, setDeleteItem] = React.useState<ShipmentDescriptionType | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  async function load() {
    try {
      const res = await adminService.listShipmentDescriptionTypes();
      setTypes(Array.isArray(res?.types) ? res.types : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  // ── Create
  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateBusy(true);
    try {
      await adminService.createShipmentDescriptionType({
        label: createForm.label,
        sortOrder: createForm.sortOrder ? parseInt(createForm.sortOrder) : 0,
      });
      setShowCreate(false);
      setCreateForm({ label: "", sortOrder: "" });
      setToast({ type: "success", text: "Gönderi açıklama tipi oluşturuldu." });
      await load();
    } catch (err: any) {
      setCreateError(err.message || "Oluşturulamadı.");
    } finally {
      setCreateBusy(false);
    }
  }

  // ── Edit
  function openEdit(item: ShipmentDescriptionType) {
    setEditItem(item);
    setEditForm({
      label: item.label,
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
    setEditError(null);
  }

  async function onEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setEditError(null);
    setEditBusy(true);
    try {
      await adminService.updateShipmentDescriptionType(editItem.id, {
        label: editForm.label,
        isActive: editForm.isActive,
        sortOrder: editForm.sortOrder ? parseInt(editForm.sortOrder) : 0,
      });
      setEditItem(null);
      setToast({ type: "success", text: "Güncellendi." });
      await load();
    } catch (err: any) {
      setEditError(err.message || "Güncellenemedi.");
    } finally {
      setEditBusy(false);
    }
  }

  // ── Delete
  async function onDeleteConfirm() {
    if (!deleteItem) return;
    setDeleteBusy(true);
    try {
      await adminService.deleteShipmentDescriptionType(deleteItem.id);
      setDeleteItem(null);
      setToast({ type: "success", text: "Tip silindi." });
      await load();
    } catch (err: any) {
      setDeleteItem(null);
      setToast({ type: "error", text: err.message || "Silinemedi." });
    } finally {
      setDeleteBusy(false);
    }
  }

  // ── Skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Gönderi Açıklama Tipleri</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gönderi Açıklama Tipleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gönderilerde görünen açıklama seçeneklerini yönetin
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(null); setCreateForm({ label: "", sortOrder: "" }); }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Yeni Ekle
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Tag className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{types.length}</div>
            <div className="text-xs font-medium text-slate-500">Toplam Tip</div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{types.filter((t) => t.isActive).length}</div>
            <div className="text-xs font-medium text-slate-500">Aktif Tip</div>
          </div>
        </div>
      </div>

      {/* List */}
      {types.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <Tag className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Henüz gönderi açıklama tipi yok</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            İlk tipi ekle
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Açıklama Tipi</span>
            <span className="text-center">Sıra</span>
            <span className="text-center">Durum</span>
            <span className="text-right">İşlemler</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {types.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* Label */}
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-400">ID: {item.id}</div>
                  </div>
                </div>

                {/* Sort order */}
                <span className="w-14 text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {item.sortOrder}
                  </span>
                </span>

                {/* Status badge */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    item.isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {item.isActive ? "Aktif" : "Pasif"}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteItem(item)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Yeni Gönderi Açıklama Tipi">
        <form onSubmit={onCreateSubmit} className="space-y-4">
          {createError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {createError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Açıklama Adı <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="örn. Elektronik Ürünler"
              value={createForm.label}
              onChange={(e) => setCreateForm((p) => ({ ...p, label: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Sıra Numarası
            </label>
            <input
              className={inputCls}
              type="number"
              min="0"
              placeholder="0"
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm((p) => ({ ...p, sortOrder: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">Küçük numara → listede önce görünür</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {createBusy ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────── */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Düzenle — ${editItem?.label ?? ""}`}>
        <form onSubmit={onEditSubmit} className="space-y-4">
          {editError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {editError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Açıklama Adı <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              value={editForm.label}
              onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sıra Numarası</label>
            <input
              className={inputCls}
              type="number"
              min="0"
              value={editForm.sortOrder}
              onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Durum</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditForm((p) => ({ ...p, isActive: true }))}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                  editForm.isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                ✓ Aktif
              </button>
              <button
                type="button"
                onClick={() => setEditForm((p) => ({ ...p, isActive: false }))}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                  !editForm.isActive
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                ✕ Pasif
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={editBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {editBusy ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={onDeleteConfirm}
        label={deleteItem?.label ?? ""}
        busy={deleteBusy}
      />

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
    </div>
  );
}
