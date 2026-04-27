// Client-side CSV + XLSX export helpers used across the admin.
import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => string | number | boolean | null | undefined;
}

function cellValue<T>(row: T, col: ExportColumn<T>): string {
  const raw = col.accessor
    ? col.accessor(row)
    : (row as Record<string, unknown>)[col.key as string];
  if (raw === null || raw === undefined) return "";
  if (raw instanceof Date) return raw.toISOString();
  return String(raw);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadCSV<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const header = columns.map((c) => csvEscape(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => csvEscape(cellValue(r, c))).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, ensureExt(filename, "csv"));
}

export function downloadXLSX<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  sheetName = "Sheet1",
) {
  const aoa: (string | number | boolean)[][] = [
    columns.map((c) => c.header),
    ...rows.map((r) =>
      columns.map((c) => {
        const raw = c.accessor
          ? c.accessor(r)
          : (r as Record<string, unknown>)[c.key as string];
        if (raw === null || raw === undefined) return "";
        if (typeof raw === "number" || typeof raw === "boolean") return raw;
        return String(raw);
      }),
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(12, c.header.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, ensureExt(filename, "xlsx"));
}

function ensureExt(name: string, ext: string): string {
  return name.endsWith(`.${ext}`) ? name : `${name}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
