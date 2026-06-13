# Maybe Finance — Frontend Dashboard (Racks Finance)

Antarmuka web interaktif untuk **Maybe Finance** (atau Racks Finance). Dibuat menggunakan **React**, **TypeScript**, dan **Vite** dengan sistem desain premium bertema gelap modern (*modern dark utility-driven UI*).

---

## 🛠️ Tech Stack

- **Framework:** React 19 (Client-Side Rendering)
- **Build Tool:** Vite
- **Router:** React Router DOM v6
- **Styling:** Tailwind CSS + Radix UI Primitives
- **Komponen UI:** Custom Shadcn/ui & Lucide Icons
- **Visualisasi Data:** Recharts (Sankey diagrams, Line, Bar, & Pie Charts)
- **Notifikasi:** Sonner (Toast alerts)

---

## 📂 Struktur Direktori

```text
frontend/
├── public/              # Aset statis publik (logo, gambar)
├── src/
│   ├── assets/          # File gambar/ikon lokal pendukung
│   ├── components/      # Komponen UI modular
│   │   ├── ui/          # Komponen primitif (Button, Input, Dropdown, dll)
│   │   ├── layout/      # Shell navigasi (Sidebar, SiteHeader, NavUser)
│   │   ├── charts/      # Recharts wrapper (Sankey, Pie, Area)
│   │   ├── dashboard/   # Widget penunjang halaman overview
│   │   └── transactions/# Form, tabel, & modal pencatatan keuangan
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Konfigurasi inti
│   │   ├── contexts/    # Context providers (Bahasa, Tema, QuickAdd)
│   │   ├── utils/       # Pembantu (formatters, theme, cn helper)
│   │   └── api.ts       # Client HTTP fetcher terpusat
│   ├── pages/           # Halaman utama aplikasi (Dashboard, Accounts, dll)
│   ├── types/           # Deklarasi tipe TypeScript global
│   ├── App.tsx          # Konfigurasi routing utama
│   ├── index.css        # Konfigurasi CSS global & custom utilities
│   └── main.tsx         # Entry point React
├── tailwind.config.ts   # Konfigurasi ekstensi tema Tailwind
└── tsconfig.json        # Pengaturan kompiler TypeScript
```

---

## 🎨 Standarisasi Font & Warna (Styling Guide)

Untuk menjaga konsistensi UI sesuai dengan arahan desain **AGENTS.md**, gunakan kelas utilitas berikut yang sudah dideklarasikan di `index.css`:

### 1. Teks Biasa (Standard Text)
Gunakan font sans-serif (**Geist** atau **Inter**) untuk label, judul, penjelasan, dan form:
- **Teks Utama:** `.text-regular-primary` (Warna putih terang / `#F8FAFC`)
- **Teks Muted/Keterangan:** `.text-regular-secondary` (Warna abu-abu pudar / `#94A3B8`)

```tsx
<h3 className="text-regular-primary font-semibold">Nama Rekening</h3>
<p className="text-regular-secondary text-xs">Diperbarui baru saja</p>
```

### 2. Teks Duit & Angka (Monetary Values)
Semua angka, persen, dan nilai uang **WAJIB** menggunakan font monospaced (**Geist Mono** / **JetBrains Mono**) dengan properti `tabular-nums` untuk mencegah pergeseran tata letak (*layout shift*) saat angka berubah:
- **Saldo Netral/Utama:** `.text-money-primary` (Putih)
- **Detail Saldo Lampau/Muted:** `.text-money-secondary` (Abu-abu)
- **Pemasukan / Gain (+):** `.text-money-income` (Hijau / `#10B981`)
- **Pengeluaran / Loss (-):** `.text-money-expense` (Merah / `#EF4444`)
- **Tagihan Pending / Warning:** `.text-money-warning` (Kuning-Oranye / `#F59E0B`)

```tsx
// Selalu gunakan formatter formatIDR() sebelum merender
import { formatIDR } from "@/lib/utils/formatters";

<span className="text-money-income text-lg font-bold">{formatIDR(2500000)}</span>
<span className="text-money-expense text-sm">{formatIDR(-85000)}</span>
```

### 🎨 3. Website Color Customization (Sistem Tema Global)
Aplikasi mendukung kustomisasi tema visual secara real-time yang dapat diakses melalui menu **Settings**. Terdapat **8 preset tema premium**:
- **Dark Themes (4):** Default Dark, Emerald Depth, Cyberpunk Neon (Baru), Rosewood Forest (Baru).
- **Light Themes (4):** Minimalist Light, Swiss Banking, Nordic Snow (Baru), Sakura Blossom (Baru).

**Integrasi Halaman Login & Register:**
Halaman masuk dan pendaftaran sepenuhnya terintegrasi dengan variabel CSS tema (`from-sidebar via-canvas to-elevated`, `border-border/40`, dll). Warna visual, ambient glow, serta chart mockup akan otomatis menyesuaikan dengan tema aktif di peramban.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js** (rekomendasi versi 18 ke atas) di komputer Anda.

### 2. File Konfigurasi (`.env`)
Buat file `.env` di direktori `frontend/` jika Anda ingin mengarahkan API URL secara custom:
```env
VITE_API_URL=http://localhost:8080
```
*Catatan: Jika dikosongkan, frontend secara otomatis mendeteksi alamat host Anda pada port `8081` (atau `8080` sesuai port server backend).*

### 3. Instalasi & Jalankan Mode Development
Jalankan perintah berikut di terminal:
```bash
# Pindah ke direktori frontend
cd maybe-finance/frontend

# Instal dependensi
npm install

# Jalankan server lokal
npm run dev
```
Setelah berjalan, buka browser di alamat `http://localhost:5173`.

### 4. Build untuk Produksi
Untuk memeriksa kesiapan kode dan mengompilasi bundel produksi:
```bash
npm run build
```
Hasil kompilasi akan tersimpan di folder `dist/`.

### 🐳 5. Menjalankan via Docker
Kami telah menyediakan `Dockerfile` yang membungkus hasil build statis ke dalam web server **Nginx** berkinerja tinggi:
```bash
# 1. Build image docker (bisa sertakan VITE_API_URL untuk custom API endpoint)
docker build -t maybe-finance-frontend --build-arg VITE_API_URL=http://localhost:8080 .

# 2. Jalankan container di port 80 (atau petakan ke port lain, misal 3000)
docker run -d -p 3000:80 --name maybe-frontend maybe-finance-frontend
```
Aplikasi frontend kemudian dapat diakses di `http://localhost:3000`.
