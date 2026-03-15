# 🖥️ Central Computer — Sistem Manajemen Toko Komputer

> **Aplikasi web manajemen operasional toko komputer** yang menangani
> penjualan (POS), stok, servis teknisi, pengadaan barang, dan laporan
> keuangan — semua dalam satu platform terintegrasi.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Tersedia-brightgreen)](https://your-demo-url.com)
[![Video Demo](https://img.shields.io/badge/Video%20Demo-YouTube-red)](https://youtube.com/your-video-link)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 🎯 Latar Belakang & Masalah yang Diselesaikan

Banyak toko komputer skala kecil-menengah masih mengandalkan **spreadsheet Excel**
untuk mencatat penjualan dan stok. Pendekatan ini menimbulkan beberapa masalah nyata:

| Masalah | Dampak ke Bisnis |
|---|---|
| Stok dicatat manual → sering tidak sinkron | Barang sudah habis tapi masih terjual, atau stok tercatat lebih dari kenyataan |
| Tidak ada kontrol kasir | Tidak bisa membuktikan uang masuk sesuai transaksi |
| Laporan laba-rugi dibuat manual | Butuh waktu 1–2 hari, sering terlambat diambil keputusan |
| Antrian servis dicatat di kertas | Teknisi tidak tahu urutan pekerjaan, pelanggan tidak bisa dicek statusnya |

**Central Computer** hadir sebagai solusi digital yang menggantikan seluruh proses tersebut.

---

## ✅ Fitur Utama

### 💰 Point of Sale (POS) — *Meja Kasir Digital*
- Antarmuka kasir yang cepat: cari produk, tambah ke keranjang, checkout dalam hitungan detik
- Mendukung 5 metode pembayaran: Tunai, Transfer, QRIS, Debit, Kredit
- Kode diskon/promo langsung bisa divalidasi saat checkout
- Stok barang berkurang **otomatis** setiap ada transaksi

### 📦 Manajemen Stok Real-Time
- Peringatan otomatis ketika stok mendekati habis
- Riwayat lengkap setiap perubahan stok (masuk/keluar + alasan)
- Stok Opname digital: hitung fisik, sistem bandingkan, sesuaikan otomatis

### 🔧 Manajemen Servis Teknisi
- Antrian servis terstruktur dengan penugasan teknisi
- Status servis bisa dipantau: Terjadwal → Dikerjakan → Selesai
- Laporan performa teknisi (jumlah servis selesai vs dibatalkan)

### 📊 Laporan Keuangan Otomatis
- **Tren Penjualan**: grafik harian, mingguan, bulanan
- **Laporan Laba-Rugi**: pendapatan, HPP, laba kotor, dan margin (%)
- **Produk Terlaris**: ranking penjualan per produk/layanan
- Semua laporan bisa difilter per rentang tanggal + Export ke Excel/CSV

### 🔐 Kontrol Akses & Akuntabilitas
- 3 level pengguna: **Owner**, **Admin**, **Karyawan (Kasir)**
- Sistem **Shift Kasir**: rekonsiliasi uang fisik vs catatan sistem setiap akhir shift
- Semua aktivitas tercatat secara otomatis

---

## 📸 Tampilan Aplikasi

| Dashboard | POS / Kasir |
|---|---|
| ![Dashboard](docs/screenshot-dashboard.png) | ![POS](docs/screenshot-pos.png) |

| Laporan Laba-Rugi | Manajemen Stok |
|---|---|
| ![Laporan](docs/screenshot-reports.png) | ![Stok](docs/screenshot-stock.png) |

---

## 🚀 Coba Langsung (Demo)

**🔗 Live Demo:** [central-computer-demo.railway.app](https://your-demo.railway.app)

| Akun | Username | Password | Akses |
|---|---|---|---|
| Pemilik Toko | `owner` | `demo123` | Semua fitur |
| Admin | `admin` | `demo123` | Semua fitur + kelola produk |
| Kasir | `kasir_demo` | `demo123` | POS & Servis saja |

> 💡 Database demo berisi data contoh realistis: produk, transaksi, dan laporan sudah terisi.

---

## 🏗️ Cara Menjalankan Secara Lokal

**Prasyarat:** Node.js v18+

```bash
# 1. Clone repositori
git clone https://github.com/username/central-computer.git
cd central-computer

# 2. Install dependensi
npm install

# 3. Salin file konfigurasi
cp .env.example .env

# 4. Jalankan aplikasi
npm run dev
```

Buka browser di `http://localhost:3000`
Login dengan: `admin` / `password123`

---

## 🧑‍💼 Dampak Bisnis yang Dirancang

```
📉 Waktu rekap kasir harian    : dari ~60 menit → otomatis real-time
📈 Akurasi stok                : dari ±20% selisih → 100% terlacak
⏱️  Proses checkout per transaksi: dari 3–5 menit → < 1 menit
📊 Laporan laba-rugi           : dari 2 hari pengerjaan → instan (filter tanggal)
🔍 Visibilitas antrian servis  : dari kertas/verbally → dashboard digital
```

---

## 🗂️ Modul Sistem

```
Central Computer
├── 🏠 Dashboard          → KPI ringkasan & grafik tren
├── 💳 POS (Kasir)        → Transaksi penjualan + diskon
├── 📦 Produk & Stok      → Katalog + stok + riwayat
├── 🔧 Layanan Servis     → Antrian & penugasan teknisi
├── 🏭 Pemasok            → Data vendor & supplier
├── 📋 Penjualan          → Riwayat + export CSV
├── ↩️  Retur              → Pengembalian + refund
├── 🛒 Purchase Order     → Pengadaan barang
├── 🔢 Stok Opname        → Rekonsiliasi fisik vs sistem
├── 🎟️  Diskon             → Kode promo & promosi
├── ⏰ Shift Kasir        → Rekonsiliasi kas per sesi
├── 📊 Laporan            → P&L, tren, top produk
├── 👥 Pengguna           → Manajemen akun & role
└── ⚙️  Pengaturan         → Konfigurasi toko
```

---

## 🛠️ Teknologi yang Digunakan

> *Bagian ini untuk pembaca teknis. Pembaca non-teknis bisa melewati bagian ini.*

**Frontend:** React 19, React Router v7, TanStack React Query v5, Tailwind CSS v4, Recharts, Lucide Icons

**Backend:** Node.js, Express.js, TypeScript

**Database:** SQLite (`better-sqlite3`) dengan 15 tabel

**Autentikasi:** JWT (JSON Web Token) + bcrypt password hashing

**Tooling:** Vite, TSX, ESLint

---

## 📁 Struktur Proyek

```
central-computer/
├── server.ts              # Entry point Express server
├── src/
│   ├── routes/            # API endpoints (12 modul)
│   ├── middleware/        # Auth & logger
│   ├── db/                # Skema & inisialisasi database
│   ├── pages/             # Halaman React (15 halaman)
│   ├── hooks/             # React Query hooks
│   ├── components/        # Komponen UI yang dapat digunakan ulang
│   └── context/           # Auth & Toast global state
└── docs/                  # Screenshot & dokumentasi
```

---

## 📄 Dokumentasi

- [PRD — Product Requirements Document](docs/prd_central_computer.md)
- [API Endpoints Reference](docs/api-reference.md) *(coming soon)*

---

## 👤 Tentang Pengembang

Dibuat oleh **[Nama Anda]** sebagai proyek portfolio untuk mendemonstrasikan kemampuan membangun sistem informasi bisnis end-to-end.

📧 Email: [email@anda.com]
💼 LinkedIn: [linkedin.com/in/username]
🐙 GitHub: [github.com/username]

---

*Proyek ini dibuat untuk tujuan portfolio. Nama dan data yang digunakan bersifat fiktif.*
