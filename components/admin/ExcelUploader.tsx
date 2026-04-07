"use client";

import React from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

// ── Types ────────────────────────────────────────────────────────────────────

interface ExcelUploaderProps<T extends Record<string, any>> {
  /** Hangi tablo için yükleme yapılıyor */
  label: string;
  /** Excel kolon başlıkları → form field eşleşmesi */
  columnMap: { excelHeader: string; field: keyof T; type: "string" | "number" }[];
  /** Her satır için çağrılacak API fonksiyonu */
  onRowSubmit: (row: T) => Promise<void>;
  /** Yükleme tamamlandığında */
  onComplete: () => void;
  /** Kapatma */
  onClose: () => void;
}

type RowStatus = "pending" | "uploading" | "success" | "error";

interface ParsedRow<T> {
  data: T;
  status: RowStatus;
  error?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExcelUploader<T extends Record<string, any>>({
  label,
  columnMap,
  onRowSubmit,
  onComplete,
  onClose,
}: ExcelUploaderProps<T>) {
  const [step, setStep] = React.useState<"upload" | "preview" | "importing">("upload");
  const [rows, setRows] = React.useState<ParsedRow<T>[]>([]);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const fileRef = React.useRef<HTMLInputElement>(null);

  // ── Parse Excel ──────────────────────────────────────

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (jsonRows.length === 0) {
          setParseError("Excel dosyası boş veya okunamadı.");
          return;
        }

        // Kolon eşleştirme — büyük/küçük harf duyarsız
        const excelHeaders = Object.keys(jsonRows[0]);
        const headerMap = new Map<string, string>();

        for (const col of columnMap) {
          const found = excelHeaders.find(
            (h) => h.trim().toLowerCase() === col.excelHeader.toLowerCase()
          );
          if (found) {
            headerMap.set(col.excelHeader, found);
          }
        }

        // Eksik kolon kontrolü
        const missing = columnMap.filter((c) => !headerMap.has(c.excelHeader));
        if (missing.length > 0) {
          setParseError(
            `Excel'de şu kolonlar bulunamadı: ${missing.map((m) => m.excelHeader).join(", ")}\n\nExcel'deki kolonlar: ${excelHeaders.join(", ")}`
          );
          return;
        }

        // Satırları dönüştür
        const parsed: ParsedRow<T>[] = jsonRows.map((row) => {
          const obj: any = {};
          for (const col of columnMap) {
            const excelKey = headerMap.get(col.excelHeader)!;
            let val = row[excelKey];
            if (col.type === "number") {
              val = val === "" || val === null || val === undefined ? 0 : Number(val);
            } else {
              val = val === null || val === undefined ? "" : String(val).trim();
            }
            obj[col.field] = val;
          }
          return { data: obj as T, status: "pending" as RowStatus };
        });

        setRows(parsed);
        setStep("preview");
      } catch {
        setParseError("Excel dosyası okunamadı. Lütfen geçerli bir .xlsx veya .xls dosyası yükleyin.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── Satır düzenleme ──────────────────────────────────

  function updateCell(rowIdx: number, field: keyof T, value: any) {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        data: { ...next[rowIdx].data, [field]: value },
      };
      return next;
    });
  }

  function removeRow(rowIdx: number) {
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  }

  // ── Toplu gönder ────────────────────────────────────

  async function startImport() {
    setStep("importing");
    const total = rows.length;
    setProgress({ done: 0, total });

    for (let i = 0; i < total; i++) {
      setRows((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: "uploading" };
        return next;
      });

      try {
        await onRowSubmit(rows[i].data);
        setRows((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "success" };
          return next;
        });
      } catch (err: any) {
        setRows((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "error", error: err.message || "Hata" };
          return next;
        });
      }

      setProgress({ done: i + 1, total });
    }

    // Tamamlandığında parent'a bildir
    setTimeout(() => onComplete(), 500);
  }

  // ── Render ───────────────────────────────────────────

  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-4">
      {/* ── Upload Step ── */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                Excel dosyası seçin
              </p>
              <p className="text-xs text-slate-400 mt-1">.xlsx veya .xls</p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />

          {parseError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{parseError}</span>
            </div>
          )}

          {/* Beklenen kolon bilgisi */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">
              <FileSpreadsheet className="inline h-3.5 w-3.5 mr-1" />
              Excel'de beklenen kolon başlıkları:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {columnMap.map((col) => (
                <span
                  key={String(col.field)}
                  className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                >
                  {col.excelHeader}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Step ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {rows.length} satır bulundu
            </p>
            <button
              onClick={() => { setStep("upload"); setRows([]); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Farklı dosya seç
            </button>
          </div>

          {/* Tablo */}
          <div className="max-h-[40vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">#</th>
                  {columnMap.map((col) => (
                    <th
                      key={String(col.field)}
                      className="px-3 py-2 text-left font-semibold text-slate-500"
                    >
                      {col.excelHeader}
                    </th>
                  ))}
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    {columnMap.map((col) => (
                      <td key={String(col.field)} className="px-3 py-1.5">
                        <input
                          className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                          type={col.type === "number" ? "number" : "text"}
                          step={col.type === "number" ? "0.01" : undefined}
                          value={row.data[col.field] as any}
                          onChange={(e) =>
                            updateCell(
                              i,
                              col.field,
                              col.type === "number" ? +e.target.value : e.target.value
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => removeRow(i)}
                        className="grid h-6 w-6 place-items-center rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="h-3 w-3 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={startImport}
              disabled={rows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {rows.length} Satırı İçe Aktar
            </button>
          </div>
        </div>
      )}

      {/* ── Importing Step ── */}
      {step === "importing" && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">
                İçe aktarılıyor...
              </p>
              <p className="text-xs text-slate-400">
                {progress.done}/{progress.total}
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Sonuç özeti (tamamlandıysa) */}
          {progress.done === progress.total && (
            <div className="space-y-3">
              <div className="flex gap-3">
                {successCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    {successCount} başarılı
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errorCount} hatalı
                  </div>
                )}
              </div>

              {/* Hatalı satırları göster */}
              {errorCount > 0 && (
                <div className="max-h-32 overflow-auto rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-1">
                  {rows
                    .map((r, i) => ({ ...r, idx: i }))
                    .filter((r) => r.status === "error")
                    .map((r) => (
                      <p key={r.idx} className="text-xs text-red-600">
                        Satır {r.idx + 1}: {r.error}
                      </p>
                    ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}

          {/* Satır durum listesi (aktif import sırasında) */}
          {progress.done < progress.total && (
            <div className="max-h-[30vh] overflow-auto space-y-1">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                    row.status === "success"
                      ? "bg-emerald-50 text-emerald-600"
                      : row.status === "error"
                      ? "bg-red-50 text-red-500"
                      : row.status === "uploading"
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  {row.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {row.status === "success" && <Check className="h-3 w-3" />}
                  {row.status === "error" && <AlertCircle className="h-3 w-3" />}
                  <span>Satır {i + 1}</span>
                  {row.status === "error" && (
                    <span className="ml-1 text-red-400">— {row.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}