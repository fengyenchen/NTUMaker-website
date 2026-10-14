"use client";

import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, LoaderCircle, Upload, X } from "lucide-react";
import { detectMemberColumn, parseMemberCsv } from "../lib/member-csv";

type ImportResult = { imported: number; skipped: { row_number: number; reason: string }[] };

export function MemberCsvImport({ today, onImported, onClose }: {
  today: string; onImported: () => Promise<void>; onClose: () => void;
}) {
  const [rows, setRows] = useState<string[][]>([]);
  const [nameColumn, setNameColumn] = useState(-1);
  const [emailColumn, setEmailColumn] = useState(-1);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileReadVersion = useRef(0);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const headers = rows[0] ?? [];
  const mapped = useMemo(() => rows.slice(1).map((row, index) => ({
    row_number: index + 2,
    display_name: (row[nameColumn] ?? "").trim(),
    email: (row[emailColumn] ?? "").trim(),
    empty: row.every((cell) => !cell.trim()),
  })).filter((row) => !row.empty), [rows, nameColumn, emailColumn]);
  const preview = useMemo(() => {
    const seen = new Set<string>();
    return mapped.map((row) => {
      const email = row.email.toLowerCase();
      const reason = !row.display_name ? "姓名空白" : row.display_name.length > 100 ? "姓名超過 100 字" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email 格式不正確" : seen.has(email) ? "CSV 中 Email 重複" : "待匯入";
      if (reason === "待匯入") seen.add(email);
      return { ...row, reason };
    });
  }, [mapped]);
  const inputClass = "min-h-11 w-full border border-border bg-background px-3";

  async function readFile(file?: File) {
    if (!file || busy) return;
    const version = ++fileReadVersion.current;
    setRows([]); setResult(null); setError(""); setFileName(""); setReading(true);
    try {
      if (!/\.csv$/i.test(file.name)) throw new Error("請選擇 CSV 檔案");
      if (file.size > 5 * 1024 * 1024) throw new Error("CSV 檔案不可超過 5 MB");
      const text = await file.text();
      if (version !== fileReadVersion.current) return;
      if (text.includes("\uFFFD")) throw new Error("請將 CSV 另存為 UTF-8 編碼後再上傳");
      const parsed = parseMemberCsv(text);
      if (parsed.length < 2) throw new Error("CSV 必須包含標題列和社員資料");
      if (parsed.slice(1).filter((row) => row.some((cell) => cell.trim())).length > 2000) throw new Error("每次最多匯入 2,000 筆資料");
      setRows(parsed);
      setFileName(file.name);
      setNameColumn(detectMemberColumn(parsed[0], "name"));
      setEmailColumn(detectMemberColumn(parsed[0], "email"));
    } catch (cause) { if (version === fileReadVersion.current) setError(cause instanceof Error ? cause.message : "無法讀取 CSV"); }
    finally { if (version === fileReadVersion.current) setReading(false); }
  }

  return <section className="mt-7 border border-border bg-surface p-5">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black">批量匯入社員</h2>
      <button type="button" disabled={busy} onClick={onClose} aria-label="關閉 CSV 匯入" className="grid size-11 place-items-center"><X size={19} /></button>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">上傳 CSV，確認姓名與 Email 欄位，再設定共同的結束日期。已存在的帳號會跳過，不會覆寫。</p>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <form className="mt-5 grid gap-4" onSubmit={async (event) => {
      event.preventDefault();
      if (busy || result || nameColumn < 0 || emailColumn < 0 || nameColumn === emailColumn || !mapped.length) return;
      setBusy(true); setError("");
      try {
        const response = await fetch("/api/v1/admin/users/import", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expires_at: expiresAt, rows: mapped.map(({ row_number, display_name, email }) => ({ row_number, display_name, email })) }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "匯入失敗，請檢查資料後重試");
        setResult(data); await onImported();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "匯入失敗"); }
      finally { setBusy(false); }
    }}>
      <div
        onDragEnter={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = busy ? "none" : "copy"; }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault(); setDragging(false);
          if (busy) return;
          if (event.dataTransfer.files.length !== 1) { setError("請一次拖入一個 CSV 檔案"); return; }
          void readFile(event.dataTransfer.files[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-6 transition-colors sm:p-8 ${dragging ? "border-accent bg-accent/10" : "border-border bg-background"} ${busy ? "opacity-50" : ""}`}
      >
        <input ref={fileInput} type="file" accept=".csv,text/csv" aria-label="選擇社員 CSV 檔案" disabled={busy} tabIndex={-1} className="hidden" onChange={(event) => {
          void readFile(event.target.files?.[0]);
          event.target.value = "";
        }} />
        <div className={`flex items-center gap-4 ${fileName ? "flex-col sm:flex-row" : "flex-col text-center"}`}>
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-surface text-accent">
            {reading ? <LoaderCircle size={24} className="animate-spin" /> : fileName ? <FileSpreadsheet size={24} /> : <Upload size={24} />}
          </div>
          <div className={fileName ? "min-w-0 flex-1 text-center sm:text-left" : ""} aria-live="polite">
            <p className="break-all font-bold">{reading ? "正在讀取檔案…" : fileName || (dragging ? "放開即可載入 CSV" : "將 CSV 檔案拖到這裡")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{fileName ? `已讀取 ${mapped.length} 筆資料，請確認下方欄位與結束日期` : "或按下方按鈕選擇檔案 · UTF-8 CSV · 最大 5 MB"}</p>
          </div>
          <button type="button" disabled={busy || reading} onClick={() => fileInput.current?.click()} className="button-25d inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-40">
            <Upload size={16} />{fileName ? "更換檔案" : "選擇檔案"}
          </button>
        </div>
      </div>
      {!!headers.length && <>
        <div className="grid gap-4 md:grid-cols-3">
          {(["name", "email"] as const).map((kind) => <label key={kind} className="grid gap-2 text-sm font-bold">
            {kind === "name" ? "姓名欄位" : "Email 欄位"}
            <select required disabled={busy || !!result} value={kind === "name" ? nameColumn : emailColumn} onChange={(event) => (kind === "name" ? setNameColumn : setEmailColumn)(Number(event.target.value))} className={inputClass}>
              <option value={-1}>請選擇欄位</option>
              {headers.map((header, index) => <option key={index} value={index}>{index + 1}. {header || "未命名欄位"}</option>)}
            </select>
          </label>)}
          <label className="grid gap-2 text-sm font-bold">結束日期
            <input required type="date" min={today} value={expiresAt} disabled={busy || !!result} onChange={(event) => setExpiresAt(event.target.value)} className={inputClass} />
          </label>
        </div>
        {nameColumn >= 0 && emailColumn >= 0 && nameColumn !== emailColumn && <>
          <p className="text-sm">共 {mapped.length} 筆資料，初步檢查 {preview.filter((row) => row.reason === "待匯入").length} 筆可匯入。開始日期為今天；最終結果以伺服器檢查為準。</p>
          <div className="max-h-72 overflow-auto border border-border">
            <table className="w-full text-left text-sm"><thead className="bg-background"><tr><th className="p-2">資料列</th><th className="p-2">姓名</th><th className="p-2">Email</th><th className="p-2">檢查</th></tr></thead>
              <tbody>{preview.slice(0, 100).map((row) => <tr key={row.row_number} className="border-t border-border"><td className="p-2">{row.row_number}</td><td className="p-2">{row.display_name || "—"}</td><td className="p-2">{row.email || "—"}</td><td className="p-2">{row.reason}</td></tr>)}</tbody>
            </table>
          </div>
          {mapped.length > 100 && <p className="text-xs text-muted-foreground">預覽前 100 筆，匯入時會處理全部資料。</p>}
        </>}
        {nameColumn === emailColumn && nameColumn >= 0 && <p role="alert" className="text-sm text-destructive">姓名和 Email 必須選擇不同欄位。</p>}
        <button type="submit" disabled={busy || !!result || nameColumn < 0 || emailColumn < 0 || nameColumn === emailColumn || !mapped.length || !preview.some((row) => row.reason === "待匯入")} className="button-25d inline-flex min-h-11 items-center justify-center gap-2 justify-self-end rounded-lg px-4 font-bold disabled:opacity-40">
          {busy && <LoaderCircle className="animate-spin" size={17} />}{busy ? "匯入中…" : "批量匯入"}
        </button>
      </>}
    </form>
    {result && <div role="status" className="mt-5">
      <p className="font-bold">已新增 {result.imported} 位社員，跳過 {result.skipped.length} 筆。</p>
      {!!result.skipped.length && <ul className="mt-2 max-h-52 overflow-auto text-sm text-muted-foreground">{result.skipped.map((row) => <li key={row.row_number}>第 {row.row_number} 筆：{row.reason}</li>)}</ul>}
    </div>}
  </section>;
}
