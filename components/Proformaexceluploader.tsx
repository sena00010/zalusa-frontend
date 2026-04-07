"use client";

import React from "react";
import { Upload, FileSpreadsheet, AlertCircle, X, Check } from "lucide-react";
import * as XLSX from "xlsx";

export interface ParsedProformaRow {
  productDescription: string;
  hsCode: string;
  sku: string;
  quantity: string;
  unitPrice: string;
  origin: string;
}

interface ProformaExcelUploaderProps {
  onImport: (rows: ParsedProformaRow[]) => void;
  onClose: () => void;
}

const EXPECTED_COLUMNS = [
  { header: "productDescription", label: "Ürün Açıklaması", required: true },
  { header: "hsCode", label: "HS Kodu (GTİP)", required: false },
  { header: "sku", label: "SKU", required: false },
  { header: "quantity", label: "Miktar", required: true },
  { header: "unitPrice", label: "Birim Fiyat", required: true },
  { header: "origin", label: "Menşei (ülke kodu)", required: false },
];

export default function ProformaExcelUploader({ onImport, onClose }: ProformaExcelUploaderProps) {
  const [rows, setRows] = React.useState<ParsedProformaRow[]>([]);
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

        const parsed: ParsedProformaRow[] = jsonRows.map((row) => ({
          productDescription: String(row[headerMap.get("productDescription") || ""] ?? "").trim(),
          hsCode: String(row[headerMap.get("hsCode") || ""] ?? "").trim(),
          sku: String(row[headerMap.get("sku") || ""] ?? "").trim(),
          quantity: String(row[headerMap.get("quantity") || ""] ?? "1").trim() || "1",
          unitPrice: String(row[headerMap.get("unitPrice") || ""] ?? "0").trim() || "0",
          origin: String(row[headerMap.get("origin") || ""] ?? "TR").trim() || "TR",
        }));

        setRows(parsed);
        setParsed(true);
      } catch {
        setParseError("Excel dosyası okunamadı. Lütfen geçerli bir .xlsx dosyası yükleyin.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateCell(idx: number, field: keyof ParsedProformaRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleImport() {
    if (rows.length === 0) return;
    onImport(rows);
  }

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
              * işaretli kolonlar zorunludur. origin varsayılan olarak "TR" alınır.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Preview */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {rows.length} ürün bulundu
            </p>
            <button
              onClick={() => { setParsed(false); setRows([]); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Farklı dosya seç
            </button>
          </div>

          <div className="max-h-[40vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Ürün Açıklaması</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">HS Kodu</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">SKU</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Miktar</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Birim Fiyat</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Menşei</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full min-w-[140px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                        value={row.productDescription}
                        onChange={(e) => updateCell(i, "productDescription", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full min-w-[90px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                        value={row.hsCode}
                        onChange={(e) => updateCell(i, "hsCode", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                        value={row.sku}
                        onChange={(e) => updateCell(i, "sku", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full min-w-[50px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                        type="number"
                        value={row.quantity}
                        onChange={(e) => updateCell(i, "quantity", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full min-w-[60px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                        type="number"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) => updateCell(i, "unitPrice", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full min-w-[40px] rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all"
                        value={row.origin}
                        onChange={(e) => updateCell(i, "origin", e.target.value)}
                      />
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
              onClick={handleImport}
              disabled={rows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              {rows.length} Ürünü Aktar
            </button>
          </div>
        </>
      )}
    </div>
  );
}