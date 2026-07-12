import { jsPDF } from "jspdf";
import jsPDFDefault from "jspdf";
import autoTable from "jspdf-autotable";
import { formatIDR } from "./formatters";

export interface PDFExportTransaction {
  date: string;
  description: string | null;
  categoryName: string | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  adminFee?: number;
  note?: string | null;
  accountName?: string;
  transferToName?: string | null;
}

export interface PDFExportData {
  title: string;
  accountName?: string;
  dateRange?: string;
  transactions: PDFExportTransaction[];
  summary: {
    income: number;
    expense: number;
    total: number;
  };
  language: "id" | "en";
}

export function exportToPDF(data: PDFExportData) {
  const isId = data.language === "id";

  // Robustly resolve the jsPDF constructor for ESM/CJS bundlers
  const ResolvedjsPDF = jsPDF || (jsPDFDefault as any).jsPDF || jsPDFDefault;
  if (!ResolvedjsPDF) {
    throw new Error("jsPDF constructor could not be resolved.");
  }

  const doc = new ResolvedjsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Robustly resolve the autoTable function
  const autoTableFunc = typeof autoTable === "function"
    ? autoTable
    : (autoTable as any)?.default || (doc as any)?.autoTable;

  if (typeof autoTableFunc !== "function") {
    throw new Error("autoTable function could not be resolved.");
  }

  // Color Definitions (RGB)
  const colors = {
    slate900: [15, 23, 42],
    slate600: [100, 116, 139],
    slate300: [203, 213, 225],
    slate100: [241, 245, 249],
    green600: [22, 163, 74],
    red600: [220, 38, 38],
    blue600: [37, 99, 235],
  };

  // --- 1. Brand / Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(colors.slate900[0], colors.slate900[1], colors.slate900[2]);
  doc.text("Racks Finance", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(colors.slate600[0], colors.slate600[1], colors.slate600[2]);
  doc.text("PERSONAL WEALTH MANAGEMENT", 15, 24);

  // Metadata (Right aligned)
  const metaX = 195;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(colors.slate900[0], colors.slate900[1], colors.slate900[2]);
  doc.text(data.title, metaX, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(colors.slate600[0], colors.slate600[1], colors.slate600[2]);
  
  const generatedAt = new Date().toLocaleString(isId ? "id-ID" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  
  let currentY = 24;
  doc.text(`${isId ? "Diekspor pada" : "Exported on"}: ${generatedAt}`, metaX, currentY, { align: "right" });
  
  if (data.accountName) {
    currentY += 3.5;
    doc.text(`${isId ? "Akun" : "Account"}: ${data.accountName}`, metaX, currentY, { align: "right" });
  }
  
  if (data.dateRange) {
    currentY += 3.5;
    doc.text(`${isId ? "Periode" : "Period"}: ${data.dateRange}`, metaX, currentY, { align: "right" });
  }

  // Divider Line
  doc.setDrawColor(colors.slate300[0], colors.slate300[1], colors.slate300[2]);
  doc.setLineWidth(0.3);
  doc.line(15, 36, 195, 36);

  // --- 2. Summary Grid (KPI Cards) ---
  const kpiY = 40;
  const kpiWidth = 42;
  const kpiHeight = 14;
  const kpiGap = 4;
  const startX = 15;

  const kpis = [
    {
      label: isId ? "TOTAL TRANSAKSI" : "TOTAL TRANSACTIONS",
      val: String(data.summary.total),
      color: colors.slate900,
    },
    {
      label: isId ? "TOTAL PEMASUKAN" : "TOTAL INFLOW",
      val: `+${formatIDR(data.summary.income)}`,
      color: colors.green600,
    },
    {
      label: isId ? "TOTAL PENGELUARAN" : "TOTAL OUTFLOW",
      val: `-${formatIDR(data.summary.expense)}`,
      color: colors.red600,
    },
    {
      label: isId ? "ALIRAN BERSIH" : "NET FLOW",
      val: (data.summary.income - data.summary.expense >= 0 ? "+" : "") + formatIDR(data.summary.income - data.summary.expense),
      color: data.summary.income - data.summary.expense >= 0 ? colors.green600 : colors.red600,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (kpiWidth + kpiGap);
    
    // Background card
    doc.setFillColor(colors.slate100[0], colors.slate100[1], colors.slate100[2]);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(colors.slate600[0], colors.slate600[1], colors.slate600[2]);
    doc.text(kpi.label, x + 3, kpiY + 4);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, kpiY + 10);
  });

  // --- 3. Table Section ---
  const tableRows = data.transactions.map((tx) => {
    const dateStr = tx.date.slice(0, 10);
    const isIncoming = tx.type === "income";
    const isTransfer = tx.type === "transfer";
    
    let amountSign = "-";
    let typeLabel = isId ? "Keluar" : "Expense";

    if (isIncoming) {
      amountSign = "+";
      typeLabel = isId ? "Masuk" : "Income";
    } else if (isTransfer) {
      amountSign = "";
      typeLabel = "Transfer";
    }

    const categoryLabel = tx.categoryName || (isId ? "Tanpa Kategori" : "Uncategorized");
    
    let descriptionText = tx.description || (isTransfer 
      ? (isId ? `Transfer ke ${tx.transferToName || "?"}` : `Transfer to ${tx.transferToName || "?"}`) 
      : categoryLabel
    );

    if (tx.note) {
      descriptionText += `\n(${tx.note})`;
    }
    if (tx.adminFee && tx.adminFee > 0) {
      descriptionText += `\n[${isId ? "Biaya Admin" : "Admin Fee"}: ${formatIDR(tx.adminFee)}]`;
    }

    return [
      dateStr,
      descriptionText,
      categoryLabel,
      typeLabel,
      `${amountSign}${formatIDR(tx.amount)}`,
    ];
  });

  const headers = [
    isId ? "Tanggal" : "Date",
    isId ? "Deskripsi" : "Description",
    isId ? "Kategori" : "Category",
    isId ? "Tipe" : "Type",
    isId ? "Nominal" : "Amount",
  ];

  // Call the autoTable plugin
  autoTableFunc(doc, {
    startY: kpiY + kpiHeight + 6,
    head: [headers],
    body: tableRows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.slate100,
      textColor: colors.slate900,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: colors.slate900,
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Date
      1: { cellWidth: "auto" }, // Description + Notes/Fee
      2: { cellWidth: 35 }, // Category
      3: { cellWidth: 20 }, // Type
      4: { cellWidth: 35, halign: "right" }, // Amount
    },
    didParseCell: (dataCell: any) => {
      if (!dataCell.cell.styles) {
        dataCell.cell.styles = {};
      }
      if (dataCell.column.index === 4 && dataCell.section === "body") {
        const text = String(dataCell.cell.raw || "");
        if (text.startsWith("+")) {
          dataCell.cell.styles.textColor = colors.green600;
          dataCell.cell.styles.fontStyle = "bold";
        } else if (text.startsWith("-")) {
          dataCell.cell.styles.textColor = colors.red600;
          dataCell.cell.styles.fontStyle = "bold";
        } else {
          dataCell.cell.styles.textColor = colors.blue600;
          dataCell.cell.styles.fontStyle = "bold";
        }
      }
      if (dataCell.column.index === 3 && dataCell.section === "body") {
        const text = String(dataCell.cell.raw || "");
        if (text === "Masuk" || text === "Income") {
          dataCell.cell.styles.textColor = colors.green600;
        } else if (text === "Keluar" || text === "Expense") {
          dataCell.cell.styles.textColor = colors.red600;
        } else {
          dataCell.cell.styles.textColor = colors.blue600;
        }
      }
    },
  });

  // Footer text
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(colors.slate600[0], colors.slate600[1], colors.slate600[2]);
    doc.text(
      isId
        ? `Laporan ini dihasilkan secara otomatis oleh Racks Finance. Halaman ${i} dari ${totalPages}`
        : `This report was automatically generated by Racks Finance. Page ${i} of ${totalPages}`,
      105,
      287,
      { align: "center" }
    );
  }

  // --- 4. Trigger Direct File Download ---
  const filename = `${data.title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
