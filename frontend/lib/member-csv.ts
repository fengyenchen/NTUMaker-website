export function parseMemberCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else if (quoted || !field) quoted = !quoted;
      else throw new Error("CSV 引號格式不正確");
    } else if (c === "," && !quoted) { row.push(field); field = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      row.push(field); rows.push(row); row = []; field = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
  }
  if (quoted) throw new Error("CSV 引號未關閉");
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function detectMemberColumn(headers: string[], kind: "name" | "email"): number {
  return headers.findIndex((header) => kind === "name"
    ? /姓名|名字|顯示名稱|\bname\b/i.test(header)
    : /e[\s-]?mail|電子郵件|郵箱|信箱/i.test(header));
}
