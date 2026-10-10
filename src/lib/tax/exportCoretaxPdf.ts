import { jsPDF } from "jspdf";
import jsPDFDefault from "jspdf";
import autoTable from "jspdf-autotable";
import type { TaxCalculationResult } from "./coretaxCalculator";
import { formatIDR } from "@/lib/utils/formatters";

export function exportCoretaxToPDF(result: TaxCalculationResult, userName?: string) {
  // Robustly resolve the jsPDF constructor
  const ResolvedjsPDF = jsPDF || (jsPDFDefault as any).jsPDF || jsPDFDefault;
  if (!ResolvedjsPDF) {
    throw new Error("jsPDF constructor could not be resolved.");
  }

  const doc = new ResolvedjsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const autoTableFunc =
    typeof autoTable === "function"
      ? autoTable
      : (autoTable as any)?.default || (doc as any)?.autoTable;

  if (typeof autoTableFunc !== "function") {
    throw new Error("autoTable function could not be resolved.");
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LEMBAR KERJA & RINGKASAN SPT TAHUNAN CORETAX DJP", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate 400
  doc.text(
    "Simulasi PPh 21 (PP 58/2023 TER & UU HPP Pasal 17) untuk Pengisian SPT Orang Pribadi",
    14,
    18
  );

  doc.text(
    `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    pageWidth - 14,
    18,
    { align: "right" }
  );

  currentY = 35;

  // Profil Wajib Pajak Box
  doc.setFillColor(248, 250, 252); // slate 50
  doc.setDrawColor(226, 232, 240); // slate 200
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PROFIL SIMULASI WAJIB PAJAK", 18, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Wajib Pajak: ${userName || "Wajib Pajak Orang Pribadi"}`, 18, currentY + 12);
  doc.text(`Status PTKP: ${result.ptkpStatus} (${result.coretaxFields.ptkp.formattedAmount}/thn)`, 18, currentY + 18);

  doc.text(`Kategori TER Bulanan: Kategori ${result.terCategory} (${result.monthlyTerPercentage})`, 110, currentY + 12);
  doc.text(`Gaji Bruto Bulanan: ${formatIDR(result.monthlyGrossSalary)}`, 110, currentY + 18);

  currentY += 30;

  // Table 1: Rincian Angka Coretax DJP
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. Data untuk Formulir SPT Tahunan Coretax DJP", 14, currentY);

  currentY += 4;

  const coretaxRows = [
    [
      "1",
      "Penghasilan Bruto Setahun",
      "Gaji 12 bulan + Bonus/THR",
      result.coretaxFields.penghasilanBruto.formattedAmount,
    ],
    [
      "2",
      "Pengurang: Biaya Jabatan",
      "5% dari bruto (Maks. Rp 6.000.000 / tahun)",
      `-${result.coretaxFields.pengurangBiayaJabatan.formattedAmount}`,
    ],
    [
      "3",
      "Pengurang: Iuran Pensiun / JHT",
      "Iuran BPJS Ketenagakerjaan dibayar sendiri",
      `-${result.coretaxFields.pengurangIuranPensiun.formattedAmount}`,
    ],
    [
      "4",
      "Pengurang: Zakat / Sumbangan",
      "Disalurkan melalui BAZNAS / LAZ resmi",
      `-${result.coretaxFields.pengurangZakat.formattedAmount}`,
    ],
    [
      "5",
      "Total Pengurang Penghasilan Bruto",
      "Akumulasi Biaya Jabatan + Pensiun + Zakat",
      `-${result.coretaxFields.totalPengurang.formattedAmount}`,
    ],
    [
      "6",
      "Penghasilan Neto Setahun",
      "Bruto dikurangi Total Pengurang (Form 1721-A1 #12)",
      result.coretaxFields.penghasilanNeto.formattedAmount,
    ],
    [
      "7",
      `PTKP (Status: ${result.ptkpStatus})`,
      "Penghasilan Tidak Kena Pajak",
      result.coretaxFields.ptkp.formattedAmount,
    ],
    [
      "8",
      "Penghasilan Kena Pajak (PKP)",
      "Neto - PTKP (dibulatkan penuh ke ribuan)",
      result.coretaxFields.pkp.formattedAmount,
    ],
    [
      "9",
      "PPh Pasal 21 Terutang Setahun",
      "Tarif Progresif Pasal 17 UU HPP",
      result.coretaxFields.pphTerutang.formattedAmount,
    ],
    [
      "10",
      "Kredit Pajak (Dipotong Pemberi Kerja)",
      "Bukti Potong 1721-A1 dari Perusahaan",
      result.coretaxFields.kreditPajakDipungut.formattedAmount,
    ],
    [
      "11",
      "Status Akhir SPT Tahunan",
      "PPh Terutang dikurangi Kredit Pajak",
      "Rp 0 (NIHIL)",
    ],
  ];

  autoTableFunc(doc, {
    startY: currentY,
    head: [["No", "Elemen Formulir Coretax", "Keterangan", "Nilai Nominal"]],
    body: coretaxRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 60, fontStyle: "bold" },
      2: { cellWidth: 70 },
      3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Table 2: Rincian Potongan Slip Gaji Bulanan (TER PP 58/2023)
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. Rincian Pemotongan Bulanan & Slip Gaji", 14, currentY);

  currentY += 4;

  const monthlyRows = [
    [
      "Bulan Normal (Jan - Nov)",
      formatIDR(result.monthlyGrossSalary),
      `TER ${result.terCategory}: ${result.monthlyTerPercentage}`,
      formatIDR(result.monthlyTaxNormal),
      formatIDR(result.monthlyBpjsTk),
      formatIDR(result.monthlyTakeHomePayNormal),
    ],
  ];

  if (result.hasThr) {
    monthlyRows.push([
      `Bulan Penerimaan THR (Bulan ${result.thrMonth})`,
      formatIDR(result.thrMonthGross),
      `TER ${result.terCategory}: ${(result.thrMonthTerRate * 100).toFixed(2)}%`,
      formatIDR(result.thrMonthTax),
      formatIDR(result.monthlyBpjsTk),
      formatIDR(result.thrMonthTakeHomePay),
    ]);
  }

  monthlyRows.push([
    "Masa Desember (Rekonsiliasi Tahunan)",
    formatIDR(result.decemberGross),
    "Rekonsiliasi Ps 17",
    formatIDR(Math.max(0, result.decemberTax)),
    formatIDR(result.monthlyBpjsTk),
    formatIDR(result.decemberTakeHomePay),
  ]);

  autoTableFunc(doc, {
    startY: currentY,
    head: [
      [
        "Periode Slip Gaji",
        "Penghasilan Bruto",
        "Tarif Pemotongan",
        "Potongan PPh 21",
        "Potongan BPJS TK",
        "Take-Home Pay",
      ],
    ],
    body: monthlyRows,
    theme: "grid",
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: "bold" },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: 25, halign: "right", textColor: [180, 83, 9] },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right", fontStyle: "bold", textColor: [22, 101, 52] },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Catatan Rekonsiliasi & Panduan Coretax
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Panduan Pengisian di Portal Coretax DJP:", 18, currentY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "1. Mintalah Bukti Pemotongan 1721-A1 dari bagian HRD/Finance perusahaan tempat Anda bekerja.",
    18,
    currentY + 10
  );
  doc.text(
    "2. Login ke portal Coretax DJP (pajak.go.id), pilih menu Surat Pemberitahuan (SPT) Tahunan Orang Pribadi.",
    18,
    currentY + 14
  );
  doc.text(
    "3. Cocokkan angka prepopulated dengan tabel data di atas. Pastikan status akhir SPT adalah NIHIL (Rp 0).",
    18,
    currentY + 18
  );

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Dihasilkan otomatis oleh Maybe Finance • Perhitungan mengacu pada PMK 168/2023 & UU HPP No. 7/2021",
    14,
    doc.internal.pageSize.getHeight() - 8
  );

  doc.save(`Coretax_PPh21_Summary_${result.ptkpStatus}_${new Date().getFullYear()}.pdf`);
}
