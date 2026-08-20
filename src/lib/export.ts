import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Row = (string | number)[];

export interface ReportSection {
  title: string;
  head: string[];
  rows: Row[];
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const esc = (v: string | number) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCSV(filename: string, sections: ReportSection[], meta?: string[]) {
  const lines: string[] = [];
  meta?.forEach((m) => lines.push(esc(m)));
  if (meta?.length) lines.push("");
  sections.forEach((s) => {
    lines.push(esc(s.title));
    lines.push(s.head.map(esc).join(";"));
    s.rows.forEach((r) => lines.push(r.map(esc).join(";")));
    lines.push("");
  });
  download("\uFEFF" + lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportPDF(filename: string, title: string, sections: ReportSection[], meta?: string[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 40, 44);
  doc.setFontSize(9);
  let y = 60;
  meta?.forEach((m) => {
    doc.text(m, 40, y);
    y += 13;
  });
  y += 6;
  sections.forEach((s) => {
    doc.setFontSize(11);
    doc.text(s.title, 40, y);
    autoTable(doc, {
      startY: y + 8,
      head: [s.head],
      body: s.rows.map((r) => r.map(String)),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error autotable augments doc
    y = doc.lastAutoTable.finalY + 28;
  });
  doc.save(filename);
}
