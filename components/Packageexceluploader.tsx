"use client";

import React from "react";
import { Upload, FileSpreadsheet, AlertCircle, X, Check } from "lucide-react";
import * as XLSX from "xlsx";

export interface ParsedPackageRow {
  widthCm: string;
  lengthCm: string;
  heightCm: string;
  weightKg: string;
  packageCount: string;
}

interface PackageExcelUploaderProps {
  onImport: (rows: ParsedPackageRow[]) => void;
  onClose: () => void;
}

const EXPECTED_COLUMNS = [
  { header: "widthCm", label: "En (cm)", required: true },
  { header: "lengthCm", label: "Boy (cm)", required: true },
  { header: "heightCm", label: "Yükseklik (cm)", required: true },
  { header: "weightKg", label: "Ağırlık (kg)", required: true },
  { header: "packageCount", label: "Koli Adedi", required: false },
];

export default function PackageExcelUploader({ onImport, onClose }: PackageExcelUploaderProps) {
  const [rows, setRows] = React.useState<ParsedPackageRow[]>([]);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [parsed, setParsed] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setParsed(false);

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

        const excelHeaders = Object.keys(jsonRows[0]);
        const headerMap = new Map<string, string>();

        for (const col of EXPECTED_COLUMNS) {
          const found = excelHeaders.find(
            (h) => h.trim().toLowerCase() === col.header.toLowerCase()
          );
          if (found) headerMap.set(col.header, found);
        }

        // Zorunlu kolon kontrolü
        const missingRequired = EXPECTED_COLUMNS.filter(
          (c) => c.required && !headerMap.has(c.header)
        );
        if (missingRequired.length > 0) {
          setParseError(
            `Excel'de şu zorunlu kolonlar bulunamadı: ${missingRequired.map((m) => m.header).join(", ")}\n\nExcel'deki kolonlar: ${excelHeaders.join(", ")}`
          );
          return;
        }

        const parsed: ParsedPackageRow[] = jsonRows.map((row) => {
          const getVal = (key: string, fallback: string) => {
            const excelKey = headerMap.get(key);
            if (!excelKey) return fallback;
            const val = row[excelKey];
            return val === "" || val === null || val === undefined ? fallback : String(val).trim();
          };

          return {
            widthCm: getVal("widthCm", "0"),
            lengthCm: getVal("lengthCm", "0"),
            heightCm: getVal("heightCm", "0"),
            weightKg: getVal("weightKg", "0"),
            packageCount: getVal("packageCount", "1") || "1",
          };
        });

        setRows(parsed);
        setParsed(true);
      } catch {
        setParseError("Excel dosyası okunamadı. Lütfen geçerli bir .xlsx dosyası yükleyin.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateCell(idx: number, field: keyof ParsedPackageRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  // Özet hesaplamaları
  const totalPackages = rows.reduce((sum, r) => sum + Math.max(1, Math.round(Number(r.packageCount) || 1)), 0);
  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weightKg) || 0) * Math.max(1, Math.round(Number(r.packageCount) || 1)), 0);
  const totalVolumetric = rows.reduce((sum, r) => {
    const w = Number(r.widthCm) || 0, l = Number(r.lengthCm) || 0, h = Number(r.heightCm) || 0;
    const v = (w * l * h) / 5000;
    return sum + v * Math.max(1, Math.round(Number(r.packageCount) || 1));
  }, 0);

  return (
    <div className="space-y-4">
      {!parsed ? (
        <>
          {/* Upload Area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Excel dosyası seçin</p>
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
              {EXPECTED_COLUMNS.map((col) => (
                <span
                  key={col.header}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
                    col.required
                      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                >
                  {col.header}
                  {col.required && <span className="text-red-400 ml-0.5">*</span>}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * işaretli kolonlar zorunludur. packageCount belirtilmezse 1 olarak alınır.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Preview Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {rows.length} paket türü bulundu
            </p>
            <button
              onClick={() => { setParsed(false); setRows([]); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Farklı dosya seç
            </button>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-indigo-50 px-4 py-3 text-center ring-1 ring-indigo-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Toplam Koli</div>
              <div className="mt-1 text-xl font-extrabold text-indigo-700">{totalPackages}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Gerçek Ağırlık</div>
              <div className="mt-1 text-xl font-extrabold text-emerald-700">{totalWeight.toFixed(2)} kg</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center ring-1 ring-amber-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Desi</div>
              <div className="mt-1 text-xl font-extrabold text-amber-700">{totalVolumetric.toFixed(2)} kg</div>
            </div>
          </div>

          {/* Table */}
          <div className="max-h-[40vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">En (cm)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Boy (cm)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Yükseklik (cm)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Ağırlık (kg)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Koli Adedi</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Desi</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => {
                  const w = Number(row.widthCm) || 0, l = Number(row.lengthCm) || 0, h = Number(row.heightCm) || 0;
                  const vol = (w * l * h) / 5000;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-1.5">
                        <input
                          className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                          type="number" step="0.01"
                          value={row.widthCm}
                          onChange={(e) => updateCell(i, "widthCm", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                          type="number" step="0.01"
                          value={row.lengthCm}
                          onChange={(e) => updateCell(i, "lengthCm", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                          type="number" step="0.01"
                          value={row.heightCm}
                          onChange={(e) => updateCell(i, "heightCm", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                          type="number" step="0.01"
                          value={row.weightKg}
                          onChange={(e) => updateCell(i, "weightKg", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="w-full min-w-[50px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                          type="number"
                          value={row.packageCount}
                          onChange={(e) => updateCell(i, "packageCount", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-slate-500 font-medium">
                        {vol.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => removeRow(i)}
                          className="grid h-6 w-6 place-items-center rounded hover:bg-red-50 transition-colors"
                        >
                          <X className="h-3 w-3 text-red-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
              onClick={() => { if (rows.length > 0) onImport(rows); }}
              disabled={rows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              {rows.length} Paketi Aktar
            </button>
          </div>
        </>
      )}
    </div>
  );
}