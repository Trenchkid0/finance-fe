"use client";

import React, { createContext, useContext, useState } from "react";

export const translations = {
  id: {
    // Navigation / Sidebar
    dashboard: "Dasbor",
    accounts: "Rekening",
    transactions: "Transaksi",
    income: "Pemasukan",
    expenses: "Pengeluaran",
    budget: "Anggaran",
    settings: "Pengaturan",
    profile: "Profil",
    logout: "Keluar",

    // Auth
    loginTitle: "Masuk ke Akun",
    loginSubtitle: "Gunakan email dan kata sandi Anda",
    emailLabel: "Alamat Email",
    passwordLabel: "Kata Sandi",
    forgotPassword: "Lupa kata sandi?",
    loginButton: "Masuk ke Akun",
    noAccount: "Belum punya akun?",
    registerFree: "Daftar gratis",
    registerTitle: "Buat Akun Baru",
    registerSubtitle: "Mulai perjalanan finansial Anda hari ini",
    fullNameLabel: "Nama Lengkap",
    fullNamePlaceholder: "Mis. Caesa Putra",
    registerButton: "Buat Akun Saya",
    alreadyHaveAccount: "Sudah punya akun?",
    loginHere: "Masuk",

    // Transactions Client
    transactionsTitle: "Transaksi",
    transactionsSubtitle: "Kelola dan telusuri pemasukan, pengeluaran, dan transfer.",
    export: "Ekspor",
    addTransaction: "Tambah Transaksi",
    totalTransactions: "Total Transaksi",
    incomeLabel: "Pemasukan",
    expenseLabel: "Pengeluaran",
    detailsHeader: "Rincian Transaksi",
    categoryHeader: "Kategori",
    amountHeader: "Jumlah",
    dateRangeLabel: "Rentang Tanggal",
    startDateLabel: "Tanggal mulai",
    endDateLabel: "Tanggal akhir",
    applyFilter: "Terapkan Filter",
    resetFilter: "Reset",
    searchPlaceholder: "Cari deskripsi atau catatan...",
    allTypes: "Semua tipe",
    allAccounts: "Semua akun",
    allCategories: "Semua kategori",
    noCategory: "Tanpa kategori",
    editOption: "Ubah",
    duplicateOption: "Duplikasi",
    deleteOption: "Hapus",
    cancelButton: "Batal",
    deleteSelected: "Hapus Terpilih",
    selectedCount: "transaksi terpilih",
    confirmBulkTitle: "Hapus Transaksi Terpilih",
    confirmBulkDesc: "Apakah Anda yakin ingin menghapus {count} transaksi terpilih? Tindakan ini tidak dapat dibatalkan dan saldo akun terkait akan disesuaikan kembali secara otomatis.",
    transactionCount: "transaksi",
    transferLabel: "Transfer",
    transferFund: "Transfer Dana",
    noDescription: "Tanpa Deskripsi",
    receiptLabel: "Struk",
    viewReceipt: "Lihat Struk",
    activeFilter: "Filter Aktif",
    deleteTransaction: "Hapus transaksi",
    deleteTransactionDesc: "Saldo akun akan disesuaikan otomatis.",
    deleteTransferDesc: "Saldo akun sumber dan akun tujuan akan dikoreksi otomatis.",
    deletingLabel: "Menghapus...",
    exportImport: "Ekspor / Impor",
    noMatchingTransactions: "Tidak ada transaksi cocok",
    noMatchingDesc: "Coba ubah kata kunci atau reset filter.",
    noTransactions: "Belum ada transaksi",
    noTransactionsDesc: "Catat transaksi pertama Anda untuk mulai melacak arus kas.",
    addAccountFirst: "Tambahkan akun terlebih dahulu untuk mencatat transaksi.",
  },
  en: {
    // Navigation / Sidebar
    dashboard: "Dashboard",
    accounts: "Accounts",
    transactions: "Transactions",
    income: "Income",
    expenses: "Expenses",
    budget: "Budget",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",

    // Auth
    loginTitle: "Log in to Account",
    loginSubtitle: "Use your email and password",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    forgotPassword: "Forgot password?",
    loginButton: "Log In",
    noAccount: "Don't have an account?",
    registerFree: "Sign up for free",
    registerTitle: "Create New Account",
    registerSubtitle: "Start your financial journey today",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "e.g., Caesa Putra",
    registerButton: "Create My Account",
    alreadyHaveAccount: "Already have an account?",
    loginHere: "Log In",

    // Transactions Client
    transactionsTitle: "Transactions",
    transactionsSubtitle: "Manage and track income, expenses, and transfers.",
    export: "Export",
    addTransaction: "Add Transaction",
    totalTransactions: "Total Transactions",
    incomeLabel: "Income",
    expenseLabel: "Expenses",
    detailsHeader: "Transaction Details",
    categoryHeader: "Category",
    amountHeader: "Amount",
    dateRangeLabel: "Date Range",
    startDateLabel: "Start date",
    endDateLabel: "End date",
    applyFilter: "Apply Filters",
    resetFilter: "Reset",
    searchPlaceholder: "Search description or note...",
    allTypes: "All types",
    allAccounts: "All accounts",
    allCategories: "All categories",
    noCategory: "Uncategorized",
    editOption: "Edit",
    duplicateOption: "Duplicate",
    deleteOption: "Delete",
    cancelButton: "Cancel",
    deleteSelected: "Delete Selected",
    selectedCount: "transactions selected",
    confirmBulkTitle: "Delete Selected Transactions",
    confirmBulkDesc: "Are you sure you want to delete {count} selected transactions? This action cannot be undone and corresponding account balances will be adjusted automatically.",
    transactionCount: "transactions",
    transferLabel: "Transfer",
    transferFund: "Fund Transfer",
    noDescription: "No Description",
    receiptLabel: "Receipt",
    viewReceipt: "View Receipt",
    activeFilter: "Active Filter",
    deleteTransaction: "Delete transaction",
    deleteTransactionDesc: "Account balance will be adjusted automatically.",
    deleteTransferDesc: "Source and target account balances will be corrected automatically.",
    deletingLabel: "Deleting...",
    exportImport: "Export / Import",
    noMatchingTransactions: "No matching transactions",
    noMatchingDesc: "Try changing keyword or resetting filters.",
    noTransactions: "No transactions yet",
    noTransactionsDesc: "Record your first transaction to start tracking cash flow.",
    addAccountFirst: "Add an account first to record transactions.",
  }
};

type Language = "id" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.id) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("app-language");
      if (stored === "id" || stored === "en") return stored;
    }
    return "id";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", lang);
    }
  };

  const t = (key: keyof typeof translations.id): string => {
    return translations[language][key] || translations["id"][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
