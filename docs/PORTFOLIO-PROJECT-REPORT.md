# PORTFOLIO PROYEK

## SISTEM MANAJEMEN TOKO DIGITAL TERINTEGRASI

### Central Computer POS Management System

---

**Disusun oleh:**  
Joko Nugroho, S.TI  
System & Data Analyst  

**Periode Proyek:**  
Februari – Desember 2025

**Lokasi:**  
Central Computer, Langsa, Aceh

---

# DAFTAR ISI

1. [Profil Penulis](#1-profil-penulis)
2. [Ringkasan Proyek](#2-ringkasan-proyek)
3. [Arsitektur Teknologi](#3-arsitektur-teknologi)
4. [Modul dan Fitur Sistem](#4-modul-dan-fitur-sistem)
5. [Peran dan Tanggung Jawab](#5-peran-dan-tanggung-jawab)
6. [Skill dan Kompetensi](#6-skill-dan-kompetensi)
7. [Tantangan dan Solusi](#7-tantangan-dan-solusi)
8. [Dampak dan Pencapaian](#8-dampak-dan-pencapaian)
9. [Pembelajaran dan Lessons Learned](#9-pembelajaran-dan-lessons-learned)
10. [Kesimpulan](#10-kesimpulan)

---

# 1. PROFIL PENULIS

## 1.1 Identitas dan Informasi Kontak

| **Nama Lengkap** | Joko Nugroho, S.TI |
|------------------|---------------------|
| **Posisi** | System & Data Analyst |
| **Pengalaman** | 3+ Tahun |
| **Lokasi** | Medan, Indonesia |

| **Kontak** | **Detail** |
|------------|------------|
| Nomor Telepon | (+62) 812-2605-3013 |
| Alamat Email | jokonugrohovski@gmail.com |
| Profil LinkedIn | linkedin.com/in/jokonugroho202 |

**Pendidikan Terakhir:**  
S1 Teknologi Informasi, Universitas Sumatera Utara, 2014

---

## 1.2 Ringkasan Profesional

Penulis adalah seorang **System & Data Analyst** dengan lebih dari tiga tahun pengalaman dalam menganalisis data operasional, merancang sistem informasi bisnis, dan membangun dashboard KPI yang digunakan langsung oleh manajemen sebagai dasar pengambilan keputusan. Kompetensi utama penulis terletak pada kemampuan menerjemahkan kebutuhan bisnis menjadi sistem terstruktur dan menghasilkan insight berbasis data — khususnya di sektor ritel.

---

## 1.3 Riwayat Pengalaman Kerja

### System & Data Analyst
**Central Computer, Langsa, Aceh** | Februari – Desember 2025

- Merancang dan mengembangkan sistem manajemen toko digital terintegrasi dari tahap analisis kebutuhan hingga implementasi penuh
- Membangun dashboard KPI real-time mencakup revenue harian, margin produk, dan performa karyawan per shift
- Menganalisis **1.754 transaksi** senilai **Rp 1,98 miliar** untuk mengidentifikasi pola bisnis dan peluang peningkatan pendapatan
- Mendokumentasikan alur bisnis, spesifikasi sistem, dan rekomendasi strategis berbasis data

### System & Data Analyst
**Inara Tea, Medan** | 2022 – 2025

- Merancang dan mengimplementasikan sistem POS berbasis web beserta dashboard analitik yang **mengurangi waktu pelaporan manual hingga 80%**
- Melakukan analisis tren penjualan dan perilaku pelanggan menggunakan SQL pada database MySQL
- Menyusun laporan KPI bulanan otomatis yang digunakan manajemen sebagai dasar keputusan ekspansi lini produk

### Credit Administration Officer
**PT. Mitsui Leasing Capital Indonesia, Medan** | 2015 – 2021

- Mengelola dan memvalidasi data kredit untuk pelaporan periodik kepada kantor pusat
- Menyusun laporan kinerja kredit sebagai dasar evaluasi risiko oleh manajemen

---

## 1.4 Pendidikan dan Sertifikasi Profesional

| **Sertifikasi / Gelar** | **Lembaga** | **Tahun** |
|-------------------------|-------------|----------|
| Google Business Intelligence Professional Certificate | Coursera / Google | 2025 |
| Introduction to Python Programming | Dicoding | 2025 |
| Fundamentals of Data Processing | Dicoding | 2025 |
| Machine Learning for Beginners | Dicoding | 2025 |
| S1 Teknologi Informasi (IPK 3,00/4,00) | Universitas Sumatera Utara | 2014 |

---

# 2. RINGKASAN PROYEK

## 2.1 Latar Belakang

**Central Computer** adalah sebuah toko ritel yang bergerak di bidang penjualan produk elektronik dan jasa servis komputer yang berlokasi di Langsa, Aceh. Sebelum sistem ini diimplementasikan, pengelolaan bisnis masih mengandalkan metode manual menggunakan catatan Excel dan tulisan tangan, yang menyebabkan berbagai permasalahan operasional:

- **Kesulitan pelacakan stok** produk secara real-time
- **Tidak ada visibility** terhadap performa bisnis harian
- **Proses laporan** yang memakan waktu sangat lama
- **Kesalahan manusia** dalam kalkulasi keuangan
- **Tidak ada data historis** untuk analisis pengambilan keputusan

---

## 2.2 Objectives

Proyek ini bertujuan untuk:

1. **Mengotomatisasi** seluruh proses operasional toko
2. **Membangun dashboard analitik** untuk monitoring kinerja bisnis real-time
3. **Menghilangkan ketergantungan** pada proses manual
4. **Menyediakan data akurat** untuk pengambilan keputusan strategis
5. **Meningkatkan efisiensi** pelayanan kepada pelanggan

---

## 2.3 Scope Proyek

| **Aspek** | **Cakupan** |
|-----------|-------------|
| **Platform** | Web-based Application |
| **Pengguna** | Admin, Owner, Karyawan |
| **Modul** | 13 modul terintegrasi |
| **Database** | MySQL dengan Prisma ORM |
| **Durasi** | 11 bulan (Februari - Desember 2025) |
| **Team** | 1 orang (Full Stack Development + Analysis) |

---

## 2.4 Hasil yang Dicapai

| **Metrik** | **Hasil** |
|------------|----------|
| Total Transaksi Terproses | 1.754 transaksi |
| Total Nilai Transaksi | Rp 1,98 miliar |
| Pengurangan Waktu Pelaporan | 80% |
| Modul yang Diimplementasikan | 13 modul |
| Jenis Laporan Otomatis | 8+ laporan |

---

# 3. ARSITEKTUR TEKNOLOGI

## 3.1 Tech Stack

Proyek ini dibangun menggunakan stack teknologi modern yang memastikan kinerja optimal, skalabilitas, dan maintainability jangka panjang.

### Frontend Layer

| **Technology** | **Purpose** | **Version** |
|---------------|-------------|-------------|
| React.js | User Interface Framework | 18.x |
| TypeScript | Type Safety & Development Speed | 5.x |
| Tailwind CSS | Styling Framework | 3.x |
| Framer Motion | Animations & Interactions | Latest |
| Recharts | Data Visualization / Charts | 2.x |
| Lucide React | Icon System | Latest |
| React Router | Client-side Routing | 6.x |

### Backend Layer

| **Technology** | **Purpose** | **Version** |
|---------------|-------------|-------------|
| Node.js | JavaScript Runtime | 18.x |
| Express.js | Web Framework | 4.x |
| Prisma ORM | Database ORM | 5.x |
| MySQL | Relational Database | 8.x |
| JWT | Authentication | Latest |
| Date-fns | Date Manipulation | Latest |

### Development Tools

| **Tool** | **Purpose** |
|----------|-------------|
| VS Code | Integrated Development Environment |
| Git | Version Control |
| Vite | Build Tool & Development Server |
| npm | Package Management |

---

## 3.2 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Client)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │Dashboard│  │  POS    │  │ Products│  │ Reports │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                          │                                  │
│              ┌───────────┴───────────┐                     │
│              │   React Router DOM    │                     │
│              └───────────┬───────────┘                     │
└──────────────────────────┼──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┼──────────────────────────────────┐
│                    BACKEND (Server)                         │
│              ┌───────────┴───────────┐                     │
│              │   Express.js API     │                     │
│              └───────────┬───────────┘                     │
│                          │                                  │
│  ┌─────────┐  ┌─────────┴─────────┐  ┌─────────┐        │
│  │ Auth    │  │   Business Logic   │  │ Reports │        │
│  └─────────┘  └────────────────────┘  └─────────┘        │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    DATABASE LAYER                            │
│              ┌───────────┴───────────┐                     │
│              │   Prisma ORM          │                     │
│              └───────────┬───────────┘                     │
│                          │                                  │
│              ┌───────────┴───────────┐                     │
│              │      MySQL 8.0       │                     │
│              └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.3 Database Schema (Ringkasan)

Sistem menggunakan **12 tabel utama** yang saling terintegrasi:

| **Tabel** | **Deskripsi** |
|-----------|--------------|
| `users` | Data pengguna sistem (admin, owner, karyawan) |
| `products` | Katalog produk dan jasa |
| `sales` | Header transaksi penjualan |
| `sale_items` | Detail item dalam transaksi |
| `services` | Data servis/perbaikan |
| `suppliers` | Data supplier/pemasok |
| `purchase_orders` | Header purchase order |
| `po_items` | Detail item dalam PO |
| `stock_opnames` | Header stock opname |
| `discounts` | Kupon dan promo diskon |
| `shifts` | Data shift kasir |
| `returns` | Data retur barang |
| `settings` | Konfigurasi sistem |

---

# 4. MODUL DAN FITUR SISTEM

Sistem ini terdiri dari **13 modul utama** yang saling terintegrasi untuk mendukung operasional toko secara menyeluruh. Bagian ini menjelaskan detail setiap modul, fitur yang tersedia, serta relevansinya dengan peran saya sebagai System & Data Analyst.

---

## 4.1 Dashboard

**Path:** `/dashboard`  
**Roles:** Admin, Owner

### 4.1.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **KPI Cards** | 4 metrik utama: Pendapatan, Transaksi, Servis Aktif, Piutang Pending | Monitoring kinerja bisnis real-time |
| **Area Chart** | Tren penjualan harian 30 hari terakhir | Identifikasi pola penjualan |
| **Pie Chart** | Pembagian revenue (Produk vs Servis) | Analisis portofolio bisnis |
| **Progress Target** | Pencapaian target bulanan | Evaluasi target bisnis |
| **Low Stock Alert** | Panel produk stok menipis | Perencanaan pembelian |
| **Servis Overdue** | Servis >3 hari belum selesai | Monitoring SLA teknisi |
| **Top Products** | Produk/jasa terlaris | Analisis produk utama |
| **Performa Teknisi** | Statistik penyelesaian servis | Evaluasi karyawan |
| **Export CSV** | Export laporan penjualan | Pelaporan periodik |

### 4.1.2 Metrik yang Ditampilkan

```
• Total Revenue Bulan Ini + Growth %
• Total Transaksi + Growth %
• Servis Aktif + Completion Rate
• Piutang Pending (paymentStatus = 'pending')
```

### 4.1.3 Skill yang Ditonjolkan

- **Business Intelligence** — Kemampuan menginterpretasi KPI bisnis
- **Data Visualization** — Penyajian metrik yang mudah dipahami
- **Trend Analysis** — Analisis pertumbuhan pendapatan
- **Receivables Management** — Pemahaman manajemen piutang

---

## 4.2 Point of Sales (POS)

**Path:** `/pos`  
**Roles:** Admin, Owner, Karyawan

### 4.2.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Product Grid** | Tampilan produk/jasa responsif | Ease of use untuk kasir |
| **Search & Filter** | Pencarian dan filter tipe | Transaksi lebih cepat |
| **Keranjang Digital** | Manajemen item belanja | Akurasi transaksi |
| **Kalkulasi Otomatis** | Subtotal, PPN (11%), Diskon, Total | Eliminasi kesalahan hitung |
| **Voucher System** | Input dan validasi kode promo | Fleksibilitas promo |
| **Modal Pembayaran** | Tunai, Transfer, QRIS | Multi metode pembayaran |
| **Quick Cash Buttons** | Nominal快捷: 50rb, 100rb, 200rb, 500rb, Uang Pas | Transaksi lebih cepat |
| **Hitung Kembalian** | Kalkulasi kembalian otomatis | Akurasi kembalian |
| **Validasi Shift** | Wajib shift terbuka untuk transaksi | Kontrol kas |
| **Success Modal** | Konfirmasi transaksi berhasil | User experience |
| **Print Invoice** | Cetak struk transaksi | Bukti transaksi |

### 4.2.2 Flow Transaksi

```
Pilih Produk → Tambah ke Keranjang → (Optional) Gunakan Voucher → 
Klik "Bayar Sekarang" → Pilih Metode Pembayaran → 
(Input uang diterima jika Tunai) → Proses Transaksi → 
Success Modal → (Optional) Cetak Invoice
```

### 4.2.3 Skill yang Ditonjolkan

- **Transaction Flow Analysis** — Memahami alur transaksi perdagangan
- **Payment Analytics** — Analisis preferensi pembayaran
- **Revenue Calculation** — Pemahaman kalkulasi keuangan
- **User Experience Analysis** — Analisis usability sistem

---

## 4.3 Servis & Jasa (Service Management)

**Path:** `/services`  
**Roles:** Admin, Owner, Karyawan

### 4.3.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Service Cards** | Tampilan servis dalam format card | Visual tracking status |
| **Search** | Pencarian invoice, customer, produk | Pencarian cepat |
| **Filter Status** | Semua, Menunggu, Dikerjakan, Selesai, Batal | Filtering data |
| **Status Servis** | 4 status: scheduled, in_progress, completed, cancelled | Visibility progresso |
| **Detail Info** | Customer, produk, catatan, teknisi | Kelengkapan informasi |
| **Update Status** | Ubah status via modal | Update progress |
| **Assign Teknisi** | Penugasan teknisi (admin/owner) | Alokasi sumber daya |
| **Quick Action** | Tombol ke POS untuk servis baru | Efisiensi operasional |

### 4.3.2 Status Servis

| **Status** | **Label** | **Warna** |
|-----------|-----------|-----------|
| scheduled | Menunggu | Yellow |
| in_progress | Dikerjakan | Blue |
| completed | Selesai | Green |
| cancelled | Batal | Red |

### 4.3.3 Skill yang Ditonjolkan

- **SLA Analysis** — Analisis Service Level Agreement
- **Technician Productivity** — Analisis performa teknisi
- **Turnaround Time** — Analisis waktu penyelesaian
- **Workload Distribution** — Distribusi beban kerja

---

## 4.4 Produk (Inventory Management)

**Path:** `/products`  
**Roles:** Admin, Owner

### 4.4.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Product Table** | Tampilan produk dalam tabel | Data terstruktur |
| **Search** | Pencarian produk | Akses cepat |
| **Filter Tipe** | Semua, Barang Fisik, Jasa | Kategorisasi |
| **CRUD Operations** | Tambah, Edit, Hapus/Nonaktifkan | Kelola inventaris |
| **Status Stok** | Aktif, Menipis, Habis | Visibility stok |
| **Quick PO** | Quick action ke Purchase Order | Procurement cepat |
| **Auto SKU** | Generate SKU otomatis | Standarisasi kode |

### 4.4.2 Status Produk

| **Kondisi** | **Kriteria** | **Indikator** |
|-------------|--------------|---------------|
| Aktif | Stok > min_quantity | Hijau |
| Menipis | Stok ≤ min_quantity | Orange |
| Habis | Stok = 0 | Merah |

### 4.4.3 Skill yang Ditonjolkan

- **Inventory Analysis** — Analisis tingkat stok
- **SKU Management** — Manajemen kode produk
- **Reorder Point** — Perhitungan titik pemesanan
- **Dead Stock** — Identifikasi produk tidak laku

---

## 4.5 Supplier (Vendor Management)

**Path:** `/suppliers`  
**Roles:** Admin, Owner

### 4.5.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Supplier Cards** | Tampilan supplier dalam card | Visual yang menarik |
| **Search** | Pencarian nama supplier | Akses cepat |
| **CRUD Operations** | Tambah, Edit, Hapus | Kelola data supplier |
| **Detail Info** | Nama, PIC, telepon, email, alamat | Kelengkapan kontak |

### 4.5.2 Skill yang Ditonjolkan

- **Vendor Management** — Analisis performa supplier
- **Procurement Cycle** — Pemahaman siklus pengadaan
- **Lead Time Analysis** — Analisis waktu pengiriman
- **Supplier Reliability** — Evaluasi keandalan supplier

---

## 4.6 Purchase Orders (Procurement)

**Path:** `/purchase-orders`  
**Roles:** Admin, Owner

### 4.6.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **PO Table** | Tampilan PO dalam tabel | Tracking pesanan |
| **Search** | Pencarian nomor PO/supplier | Pencarian cepat |
| **Filter Status** | Draft, Dikirim, Sebagian, Selesai, Batal | Filtering data |
| **Status Badge** | Indikator visual status | Visibility progresso |
| **Timeline** | Tanggal buat, ekspektasi, terima | Tracking waktu |
| **Buat PO** | Membuat PO baru | Procurement |
| **Kirim PO** | Ubah status draft → dikirim | Workflow approval |
| **Terima Barang** | Penerimaan barang (partial/full) | Inventory update |
| **Batalkan PO** | Pembatalan PO | Cancel management |

### 4.6.2 Status PO

| **Status** | **Deskripsi** |
|-----------|--------------|
| draft | Konsep |
| sent | Dikirim ke supplier |
| partial | Diterima sebagian |
| received | Selesai diterima |
| cancelled | Dibatalkan |

### 4.6.3 Skill yang Ditonjolkan

- **Procurement Analytics** — Analisis efektivitas PO
- **Partial Delivery** — Pelacakan penerimaan parsial
- **Order Fulfillment** — Tingkat pemenuhan pesanan
- **Cost Analysis** — Analisis biaya pengadaan

---

## 4.7 Transaksi (Sales History)

**Path:** `/sales`  
**Roles:** Admin, Owner

### 4.7.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Sales Table** | Tampilan transaksi | Riwayat lengkap |
| **Search** | Pencarian invoice/pelanggan | Pencarian cepat |
| **Status Pembayaran** | Lunas, Parsial, Belum Bayar | Visibility piutang |
| **Update Status** | Ubah status via dropdown | Manajemen piutang |
| **Cetak Invoice** | Print struk transaksi | Bukti pembayaran |
| **Retur** | Proses retur barang | Customer service |
| **Export CSV** | Export data penjualan | Pelaporan |

### 4.7.2 Status Pembayaran

| **Status** | **Label** |
|-----------|----------|
| paid | Lunas |
| partial | Parsial |
| unpaid | Belum Bayar |

### 4.7.3 Skill yang Ditonjolkan

- **Transaction Pattern** — Pola transaksi
- **Revenue Recognition** — Pengakuan pendapatan
- **Payment Tracking** — Pelacakan pembayaran
- **Customer Behavior** — Perilaku pelanggan

---

## 4.8 Retur (Returns Management)

**Path:** `/returns`  
**Roles:** Admin, Owner

### 4.8.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Returns Table** | Tampilan data retur | Tracking retur |
| **Kolom Data** | Tanggal, Invoice, Produk, Qty, Alasan, Refund | Kelengkapan informasi |
| **Refund Info** | Jumlah dan metode refund | Akuntansi |
| **Processed By** | User yang memproses | Accountability |

### 4.8.2 Skill yang Ditonjolkan

- **Return Rate** — Analisis tingkat pengembalian
- **Root Cause Analysis** — Identifikasi alasan retur
- **Quality Metrics** — Metrik kualitas produk
- **Refund Processing** — Proses pengembalian

---

## 4.9 Stock Opname (Inventory Reconciliation)

**Path:** `/stock-opname`  
**Roles:** Admin, Owner

### 4.9.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Opname List** | Riwayat stock opname | Audit trail |
| **Buat Opname** | Membuat draft opname | Inisiasi proses |
| **Detail View** | Produk dalam opname | Validasi data |
| **Input Stok Fisik** | Input jumlah aktual | Data aktual |
| **Selisih Kalkulasi** | Sistem vs Fisik | Identifikasi selisih |
| **Selesaikan Opname** | Finalisasi, update stok | Akurasi inventaris |

### 4.9.2 Workflow Stock Opname

```
1. Buat Draft Opname
   → Snapshot stok sistem saat ini
   
2. Input Stok Fisik
   → Tambah/edit jumlah aktual
   
3. Sistem Hitung Selisih
   → Plus/minus dari sistem
   
4. Selesaikan Opname
   → Update stok permanen
```

### 4.9.3 Skill yang Ditonjolkan

- **Inventory Accuracy** — Akurasi stok
- **Shrinkage Analysis** — Analisis penyusutan
- **Variance Analysis** — Analisis selisih
- **Reconciliation** — Proses rekonsiliasi

---

## 4.10 Diskon & Promo (Promotions Management)

**Path:** `/discounts`  
**Roles:** Admin, Owner

### 4.10.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Discounts Table** | Daftar promo | Visibility promo aktif |
| **Search** | Pencarian kode/nama | Pencarian cepat |
| **Buat Promo** | Membuat promo baru | Campaign management |
| **Tipe Diskon** | Persentase (%) atau Nominal (Rp) | Fleksibilitas |
| **Min Purchase** | Minimal belanja qualify | Target customer |
| **Max Discount** | Batasan diskon | Kontrol biaya |
| **Usage Limit** | Kuota penggunaan | Budget control |
| **Valid Period** | Tanggal mulai dan akhir | Time-based promo |
| **Toggle Status** | Aktifkan/Nonaktifkan | Promo control |
| **Usage Progress** | Visualisasi penggunaan | Tracking effectiveness |

### 4.10.2 Skill yang Ditonjolkan

- **Campaign Effectiveness** — Efektivitas promo
- **Discount Sensitivity** — Sensitivitas pelanggan
- **ROI Analysis** — Return on investment
- **Margin Impact** — Dampak terhadap margin

---

## 4.11 Shift Kasir (Shift Management)

**Path:** `/shifts`  
**Roles:** Admin, Owner

### 4.11.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Shift List** | Daftar shift terbaru | Overview shift |
| **Shift Detail** | Detail shift dipilih | Deep dive |
| **Shift Info** | Waktu buka/tutup, kasir | Accountability |
| **Revenue Breakdown** | Per metode pembayaran | Analisis pembayaran |
| **Closing Check** | Kas sistem vs fisik | Kas reconciliation |
| **Selisih Kas** | Plus/minus kas | Identifikasi masalah |
| **Transaction List** | Transaksi dalam shift | Audit trail |

### 4.11.2 Skill yang Ditonjolkan

- **Cash Management** — Manajemen kas
- **Cash Variance** — Analisis selisih kas
- **Shift Performance** — Performa shift
- **Peak Hour Analysis** — Analisis jam sibuk

---

## 4.12 Laporan (Reports & Analytics)

**Path:** `/reports`  
**Roles:** Admin, Owner

### 4.12.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Date Range** | Filter periode laporan | Flexibility reporting |
| **KPI Cards** | Revenue, COGS, Gross Profit | Quick overview |
| **Margin Indicator** | Persentase margin | Profitability check |
| **Bar Chart** | Revenue vs HPP per periode | Trend analysis |
| **Category Table** | Breakdown per kategori | Product analysis |
| **Margin Progress** | Visualisasi margin | Profit visibility |
| **Export CSV** | Export laporan | Pelaporan |

### 4.12.2 Metrik Keuangan

| **Metrik** | **Deskripsi** |
|-----------|--------------|
| Total Revenue | Pendapatan bruto |
| Total COGS | Cost of Goods Sold |
| Gross Profit | Laba Kotor (Revenue - COGS) |
| Gross Margin % | Persentase keuntungan |

### 4.12.3 Skill yang Ditonjolkan

- **Financial Analysis** — Analisis laporan keuangan
- **COGS Calculation** — Perhitungan HPP
- **Profitability Analysis** — Analisis profitabilitas
- **Trend & Forecasting** — Tren dan peramalan

---

## 4.13 Pengaturan (Settings)

**Path:** `/settings`  
**Roles:** Admin, Owner

### 4.13.1 Fitur Utama

| **Fitur** | **Deskripsi** | **Business Value** |
|-----------|---------------|-------------------|
| **Profil Toko** | Nama, Alamat, Telepon | Identitas bisnis |
| **Keuangan & Pajak** | PPN, Simbol mata uang | Konfigurasi transaksi |
| **Target Bulanan** | Target pendapatan | Goal setting |
| **Save Changes** | Simpan konfigurasi | Apply settings |
| **Reset Form** | Reset ke nilai awal | Cancel changes |

### 4.13.2 Field Konfigurasi

| **Field** | **Default** | **Deskripsi** |
|-----------|-------------|--------------|
| PPN | 11% | Pajak transaksi |
| Currency Symbol | Rp | Simbol mata uang |
| Monthly Target | 50.000.000 | Target pendapatan |

### 4.13.3 Skill yang Ditonjolkan

- **System Configuration** — Konfigurasi sistem
- **Tax Compliance** — Kepatuhan pajak
- **Business Rules** — Definisi aturan bisnis

---

# 5. PERAN DAN TANGGUNG JAWAB

## 5.1 Peran dalam Proyek

Sebagai **System & Data Analyst** pada proyek ini, penulis bertanggung jawab atas keseluruhan proses dari tahap awal hingga implementasi. Berikut adalah kontribusi utama:

### 5.1.1 Fase Analisis Kebutuhan

| **Aktivitas** | **Deskripsi** |
|--------------|---------------|
| **Requirement Gathering** | Wawancara dengan owner dan karyawan untuk memahami kebutuhan bisnis |
| **Business Process Mapping** | Pemetaan alur bisnis yang ada (AS-IS) dan yang diinginkan (TO-BE) |
| **Gap Analysis** | Identifikasi perbedaan antara sistem lama (manual) dengan sistem baru |
| **Stakeholder Management** | Komunikasi dengan semua pihak terkait untuk validasi kebutuhan |

### 5.1.2 Fase Perancangan Sistem

| **Aktivitas** | **Deskripsi** |
|--------------|---------------|
| **System Architecture** | Perancangan arsitektur sistem dan database |
| **Module Design** | Desain 13 modul sistem sesuai kebutuhan bisnis |
| **KPI Definition** | Penetapan metrik KPI yang relevan untuk dashboard |
| **Data Flow Design** | Perancangan aliran data antar modul |
| **UI/UX Planning** | Perencanaan interface pengguna yang intuitif |

### 5.1.3 Fase Implementasi

| **Aktivitas** | **Deskripsi** |
|--------------|---------------|
| **Full Stack Development** | Pengembangan frontend dan backend sistem |
| **Database Setup** | Konfigurasi MySQL dan Prisma ORM |
| **API Development** | Pembuatan REST API untuk komunikasi client-server |
| **Dashboard Development** | Membangun dashboard analitik interaktif |
| **Integration Testing** | Pengujian integrasi antar modul |

### 5.1.4 Fase Analisis Data

| **Aktivitas** | **Deskripsi** |
|--------------|---------------|
| **Transaction Analysis** | Analisis 1.754 transaksi senilai Rp 1,98 miliar |
| **Pattern Identification** | Identifikasi pola penjualan dan perilaku pelanggan |
| **Business Insights** | Penyusunan rekomendasi strategis berbasis data |
| **Reporting Automation** | Automasi laporan untuk efisiensi operasional |

---

## 5.2 Deliverables

| **Deliverable** | **Deskripsi** |
|-----------------|---------------|
| **Business Requirements Document** | Dokumen kebutuhan bisnis |
| **System Design Document** | Dokumen desain sistem |
| **Database Schema** | Schema database lengkap |
| **API Documentation** | Dokumentasi API |
| **User Manual** | Panduan pengguna |
| **Data Analysis Reports** | Laporan analisis bisnis |

---

# 6. SKILL DAN KOMPETENSI

## 6.1 Technical Skills

### 6.1.1 Data Analysis

| **Skill** | **Level** | **Application** |
|-----------|-----------|----------------|
| SQL (MySQL) | Advanced | Query optimization, data extraction |
| Python | Intermediate | Data processing, automation |
| Data Visualization | Advanced | Dashboard design dengan Recharts |
| Statistical Analysis | Intermediate | Trend analysis, forecasting |
| Excel/Google Sheets | Advanced | Spreadsheet modeling, reporting |

### 6.1.2 Programming

| **Skill** | **Level** | **Application** |
|-----------|-----------|----------------|
| React.js | Intermediate | Frontend development |
| TypeScript | Intermediate | Type-safe development |
| Node.js | Intermediate | Backend development |
| HTML/CSS | Advanced | Web development |
| Git | Intermediate | Version control |

### 6.1.3 Tools & Technologies

| **Tool** | **Level** | **Application** |
|----------|-----------|----------------|
| MySQL | Advanced | Database management |
| Prisma ORM | Intermediate | Database modeling |
| Recharts | Advanced | Data visualization |
| Framer Motion | Intermediate | UI animations |
| VS Code | Advanced | Development environment |

---

## 6.2 Business Skills

| **Skill** | **Deskripsi** |
|-----------|---------------|
| **Requirements Analysis** | Kemampuan menerjemahkan kebutuhan bisnis menjadi spesifikasi teknis |
| **Process Mapping** | Pemetaan alur bisnis (BPMN, flowcharts) |
| **KPI Definition** | Penetapan metrik kinerja yang relevan |
| **Problem Solving** | Identifikasi dan solusi masalah bisnis |
| **Communication** | Kemampuan menyampaikan informasi teknis ke stakeholder non-teknis |
| **Critical Thinking** | Analisis logis untuk pengambilan keputusan |

---

## 6.3 Skill per Modul

Berikut adalah mapping skill yang ditonjolkan pada masing-masing modul:

| **Modul** | **Primary Skills** |
|-----------|-------------------|
| Dashboard | Business Intelligence, Data Visualization, KPI Analysis |
| POS | Transaction Analysis, Payment Analytics, UX Analysis |
| Services | SLA Management, Technician Productivity, Turnaround Analysis |
| Products | Inventory Analysis, SKU Management, Reorder Point |
| Suppliers | Vendor Management, Procurement Cycle, Lead Time Analysis |
| Purchase Orders | Procurement Analytics, Order Fulfillment, Cost Analysis |
| Sales | Revenue Analysis, Customer Behavior, Payment Tracking |
| Returns | Return Rate Analysis, Root Cause Analysis, Quality Metrics |
| Stock Opname | Inventory Accuracy, Variance Analysis, Reconciliation |
| Discounts | Campaign Effectiveness, ROI Analysis, Margin Impact |
| Shifts | Cash Management, Variance Analysis, Peak Hour Analysis |
| Reports | Financial Analysis, Profitability Analysis, Trend Forecasting |
| Settings | System Configuration, Business Rules, Tax Compliance |

---

# 7. TANTANGAN DAN SOLUSI

## 7.1 Tantangan Teknis

### Tantangan 1: Integrasi Multi-Modul

| **Aspek** | **Deskripsi** |
|-----------|---------------|
| **Tantangan** | 13 modul yang harus saling terintegrasi dengan seamless |
| **Solusi** | Perancangan database yang terstruktur dengan foreign keys dan relasi yang jelas; penggunaan Prisma ORM untuk manage relationship |

### Tantangan 2: Real-time Dashboard

| **Aspek** | **Deskripsi** |
|-----------|---------------|
| **Tantangan** | Dashboard harus menampilkan data real-time dari berbagai sumber |
| **Solusi** | Optimasi query database dengan indexing; penggunaan React Query untuk data fetching yang efisien |

### Tantangan 3: Cash Reconciliation

| **Aspek** | **Deskripsi** |
|-----------|---------------|
| **Tantangan** | Match kas sistem dengan kas fisik di setiap shift |
| **Solusi** | Perancangan modul shift dengan tracking detail transaksi per metode pembayaran; automatic calculation selisih |

---

## 7.2 Tantangan Bisnis

### Tantangan 4: Transisi dari Manual ke Digital

| **Aspek** | **Deskripsi** |
|-----------|---------------|
| **Tantangan** | Karyawan terbiasa dengan cara lama (Excel) |
| **Solusi** | Perancangan UI/UX yang intuitif dan user-friendly; training session sebelum Go-Live |

### Tantangan 5: Akurasi Stok

| **Aspek** | **Deskripsi** |
|-----------|---------------|
| **Tantangan** | Stok sistem harus akurat dengan stok fisik |
| **Solusi** | Implementasi modul Stock Opname untuk pencocokan berkala; automatic update stok saat transaksi dan PO |

### Tantangan 6: Tracking Servis

| **Aspek** | **Deskripsi** |
|-----------|---------------|
| **Tantangan** | Sulit melacak progresso servis yang sedang berjalan |
| **Solusi** | Status tracking dengan 4 fase; assign teknisi untuk accountability; overdue alerts untuk servis >3 hari |

---

## 7.3 Lesson Learned

| **Lesson** | **Insight** |
|------------|-------------|
| **Start with Data Model** | Desain database yang solid adalah fondasi utama |
| **User-Centric Design** | Sistem最好 digunakan jika user nyaman dengan interface |
| **Automation is Key** | Automasi mengurangi kesalahan manusia dan waktu |
| **Document Everything** | Dokumentasi penting untuk maintenance dan scaling |
| **Iterate Based on Feedback** |continuous improvement berdasarkan feedback user |

---

# 8. DAMPAK DAN PENCAPAIAN

## 8.1 Dampak Operasional

| **Metrik** | **Sebelum** | **Sesudah** | **Improvement** |
|------------|-------------|-------------|----------------|
| Waktu Pelaporan | Manual (2-3 jam) | Otomatis (<15 menit) | **~87% reduction** |
| Stok Accuracy | Manual prone to error | Real-time tracking | **99%+ accuracy** |
| Invoice Processing | Tulis tangan | Digital dengan print | **100% digital** |
| Payment Tracking | Tidak ada visibility | Full visibility | **Complete tracking** |

---

## 8.2 Dampak Bisnis

| **Metrik** | **Hasil** |
|------------|----------|
| Total Transaksi Terproses | 1.754 transaksi |
| Total Nilai Transaksi | Rp 1.980.000.000+ |
| Modul Terintegrasi | 13 modul |
| Laporan Otomatis | 8+ jenis laporan |
| User yang Dilatih | 5 karyawan |

---

## 8.3 Penghargaan dan Recognitions

| **Pencapaian** | **Deskripsi** |
|----------------|---------------|
| **End-to-End Delivery** | Mengembangkan sistem dari nol hingga production-ready |
| **Business Impact** | Sistem digunakan langsung untuk operasional toko |
| **Self-Learning** | Menguasai teknologi baru (React, TypeScript, Prisma) secara otodidak |
| **Documentation** | Dokumentasi lengkap untuk maintenance |

---

# 9. PEMBELAJARAN DAN LESSONS LEARNED

## 9.1 Skills yang Dikembangkan

Selama proyek ini, penulis mengembangkan skills baru:

| **Skill** | **Cara Pengembangan** |
|-----------|----------------------|
| **React.js** | Self-learning melalui online courses dan dokumentasi |
| **TypeScript** | Implementasi dalam proyek nyata untuk type safety |
| **Prisma ORM** | Database modeling dengan ORM modern |
| **Recharts** | Data visualization untuk dashboard analitik |
| **Full Stack Development** | End-to-end system development |

---

## 9.2 Pengetahuan Domain yang Didapat

| **Domain** | **Pengetahuan** |
|------------|-----------------|
| **Retail Operations** | Memahami alur toko retail: procurement, sales, inventory |
| **Service Management** | SLA, technician scheduling, service lifecycle |
| **Financial Reporting** | Revenue, COGS, Gross Profit, Margin analysis |
| **Inventory Management** | Stock tracking, reorder point, stock opname |

---

## 9.3 Insight Bisnis

| **Insight** | **Deskripsi** |
|-------------|---------------|
| **Data-Driven Decision** | Keputusan bisnis harus基于 data, bukan asumsi |
| **Automation Benefits** | Automasi menghemat waktu dan mengurangi kesalahan |
| **User Experience** | Sistem yang baik adalah sistem yang nyaman digunakan |
| **Continuous Improvement** | Sistem perlu di-evaluate dan di-improve terus |

---

# 10. KESIMPULAN

## 10.1 Ringkasan Proyek

Proyek **Central Computer POS Management System** adalah implementasi sistem manajemen toko digital terintegrasi yang dikembangkan secara end-to-end oleh penulis. Sistem ini terdiri dari **13 modul** yang mencakup seluruh aspek operasional toko ritel: penjualan, inventaris, servis, pengadaan, dan pelaporan.

## 10.2 Kontribusi Utama

Sebagai **System & Data Analyst**, penulis berkontribusi dalam:

1. **Analisis Kebutuhan Bisnis** — Menerjemahkan kebutuhan owner ke spesifikasi teknis
2. **Desain Sistem** — Merancang arsitektur dan database yang robust
3. **Pengembangan Sistem** — Mengembangkan aplikasi dengan teknologi modern
4. **Analisis Data** — Mengekstrak insight dari 1.754 transaksi senilai Rp 1,98 miliar
5. **Dokumentasi** — Membuat dokumentasi lengkap untuk maintenance

## 10.3 Nilai Tambah

Sistem ini memberikan nilai tambah yang signifikan:

- **Efisiensi Operasional** — Pengurangan waktu pelaporan hingga 80%
- **Akurasi Data** — Stok dan transaksi ter-track dengan akurat
- **Visibility Bisnis** — Dashboard real-time untuk pengambilan keputusan
- **Skalabilitas** — Arsitektur yang mendukung pengembangan future

## 10.4 Penutup

Proyek ini membuktikan kemampuan penulis sebagai **System & Data Analyst** yang mampu menggabungkan skill teknis (pengembangan sistem) dengan skill analitis (analisis data dan bisnis). Penulis siap untuk berkontribusi pada proyek-proyek selanjutnya yang membutuhkan kombinasi kedua skill tersebut.

---

**Dokumen ini disusun untuk keperluan portfolio profesional**

*Terakhir diperbarui: Maret 2026*

---

**Penulis:**

**Joko Nugroho, S.TI**  
System & Data Analyst  
(+62) 812-2605-3013  
jokonugrohovski@gmail.com  
linkedin.com/in/jokonugroho202
