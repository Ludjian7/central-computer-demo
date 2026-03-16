# Laporan Fitur Dashboard

## Ringkasan

Dashboard adalah halaman utama aplikasi POS (Point of Sale) yang menampilkan ringkasan performa bisnis secara real-time. Aplikasi ini dirancang untuk bisnis retail produk elektronik dan jasa servis.

---

## Fitur-Fitur Dashboard

### 1. METRIK UTAMA (KPI Cards)

Dashboard menampilkan 4 kartu metrik utama yang memberikan gambaran cepat tentang performa bisnis:

| No | Fitur | Sumber Data | Keterangan |
|----|-------|-------------|------------|
| 1 | Pendapatan Bulan Ini | `total_revenue` | Total revenue penjualan bulan berjalan |
| 2 | Growth Pendapatan | `revenue_growth_pct` | Persentase pertumbuhan revenue vs bulan lalu |
| 3 | Transaksi Bulan Ini | `total_transactions` | Jumlah transaksi bulan berjalan |
| 4 | Growth Transaksi | `transactions_growth_pct` | Persentase pertumbuhan transaksi vs bulan lalu |
| 5 | Servis Berjalan | `active_services` | Jumlah servis yang sedang aktif/dikerjakan |
| 6 | Service Completion Rate | `service_completion_rate` | Persentase servis yang sudah selesai |
| 7 | Piutang Pending | `pending_revenue` | Total invoice belum lunas (paymentStatus = 'pending') |
| 8 | Invoice Pending | `pending_transactions` | Jumlah transaksi dengan status pending |

#### Detail Logika Piutang Pending

Piutang Pending dihitung dari tabel `sale` dengan filter:
```typescript
where: { paymentStatus: { in: ['pending'] } }
```

Query yang digunakan:
```typescript
const pendingRevenueAgg = await prisma.sale.aggregate({
  _sum: { total: true },        // Total nominal piutang
  _count: { id: true },        // Jumlah invoice
  where: { paymentStatus: { in: ['pending'] } }
});
```

Tujuan metrics ini adalah untuk monitoring tagihan yang belum lunas (receivables) yang penting untuk arus kas bisnis.

---

### 2. GRAFIK & VISUALISASI

#### 2.1 Area Chart - Tren Penjualan Harian

Grafik ini menampilkan Tren Penjualan (Harian) untuk 30 hari terakhir.

- **Endpoint**: `useReportsSalesTrend({ period: 'daily', start_date, end_date })`
- **Periode**: 30 hari terakhir
- **Data**: `total_revenue` per hari

**Fitur Grafik**:
- Gradient fill berwarna hijau
- Tooltip dengan format mata uang IDR
- Sumbu X: Tanggal (format dd MMM)
- Sumbu Y: Pendapatan (format Rp)
- Menampilkan persentase pertumbuhan (up/down arrow)

#### 2.2 Pie Chart - Porsi Pendapatan

Donut chart yang menampilkan pembagian revenue antara:

| Jenis | Warna | Sumber Data |
|-------|-------|-------------|
| Produk Fisik | `#4f46e5` (indigo) | `product_revenue` |
| Jasa Servis | `#f97316` (orange) | `service_revenue` |

- Menampilkan persentase produk di tengah donut
- Legend di bawah chart

#### 2.3 Progress Target Bulanan

Progress bar yang menampilkan pencapaian target pendapatan bulanan.

- **Sumber**: `monthly_target` dari setting database
- **Default**: Rp 50.000.000
- **Tampilan**: Progress bar dengan gradient indigo → hijau
- **Format**: Menampilkan persentase pencapaian target

---

### 3. PANEL OPERASIONAL

#### 3.1 Low Stock (Stok Menipis)

Panel ini menampilkan daftar produk yang stoknya di bawah minimum.

- **Endpoint**: `useLowStockReport()`
- **Kriteria**: `current_stock < min_stock`
- **Aksi**: Tombol "Buat PO" → navigasi ke `/purchase-orders`

**Kolom Tabel**:

| Kolom | Deskripsi |
|-------|-----------|
| SKU / Nama Produk | Kode SKU dan nama produk |
| Stok | Stok saat ini / Stok minimum |
| Kekurangan | Jumlah yang kurang (shortage) |

- **Batas Tampilan**: 5 item teratas
- Jika tidak ada item → menampilkan "Semua stok produk aman."

#### 3.2 Servis Overdue (>3 Hari)

Panel ini menampilkan servis yang sudah lebih dari 3 hari belum selesai.

- **Endpoint**: `useServiceAging(3)`
- **Kriteria**: Servis dengan `age_days > 3`
- **Aksi**: Tombol "Lihat Servis" → navigasi ke `/services`

**Kolom Tabel**:

| Kolom | Deskripsi |
|-------|-----------|
| Customer / Barang | Nama customer dan nama produk/barang |
| Teknisi | Teknisi yang menangani (atau "Unassigned") |
| Tertunda | Lama waktu tertunda (dalam hari) |

- **Batas Tampilan**: 5 item teratas
- Jika tidak ada item → menampilkan "Tidak ada servis yang overdue."

---

### 4. TABEL DATA

#### 4.1 Produk & Jasa Terlaris

Tabel ini menampilkan produk dan jasa dengan penjualan tertinggi.

- **Endpoint**: `useTopProducts({ limit: 4 })`
- **Aksi**: Link ke `/reports` (Laporan Laba Rugi)

**Kolom Tabel**:

| Kolom | Deskripsi |
|-------|-----------|
| Item | Nama item, tipe (produk/jasa), dan SKU |
| Terjual | Jumlah unit terjual |
| Pendapatan | Total revenue dari item tersebut |

#### 4.2 Performa Teknisi

Tabel ini menampilkan performa teknisi dalam menyelesaikan servis.

- **Endpoint**: `useTechnicianPerformance()`
- **Aksi**: Link ke `/users` (Kelola User)

**Kolom Tabel**:

| Kolom | Deskripsi |
|-------|-----------|
| Teknisi | Nama teknisi dengan avatar inisial |
| Total Servis | Jumlah total servis yang ditangani |
| Selesai | Jumlah servis selesai + persentase |

---

### 5. FITUR TAMBAHAN

| Fitur | Deskripsi |
|-------|-----------|
| **Export CSV** | Tombol untuk export laporan penjualan ke format CSV menggunakan `useExportSalesCSV` |
| **Loading State** | Tampilan skeleton saat data sedang dimuat |
| **Animasi** | Framer Motion dengan stagger effect pada entrance komponen |
| **Responsif** | Grid layout yang adaptif (1 → 2 → 4 kolom berdasarkan ukuran layar) |

---

## Struktur API yang Digunakan

| Hook | Endpoint | Parameter |
|------|----------|-----------|
| `useReportsSummary` | `GET /api/reports/summary` | start_date, end_date |
| `useReportsSalesTrend` | `GET /api/reports/sales-trend` | period, start_date, end_date |
| `useTopProducts` | `GET /api/reports/top-products` | start_date, end_date, limit |
| `useTechnicianPerformance` | `GET /api/reports/technician-performance` | start_date, end_date |
| `useLowStockReport` | `GET /api/reports/low-stock` | - |
| `useServiceAging` | `GET /api/reports/service-aging` | days |
| `useExportSalesCSV` | `POST /api/reports/export-csv` | filters |

---

## Tech Stack

- **Frontend**: React + TypeScript
- **Animasi**: Framer Motion
- **Charting**: Recharts (AreaChart, PieChart)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Data Fetching**: TanStack Query (via custom hooks)

---

## Estimasi Kode

| File | Estimasi Baris | Deskripsi |
|------|----------------|-----------|
| `src/pages/Dashboard.tsx` | ~563 baris | Komponen utama dashboard |
| `src/hooks/useReports.ts` | ~150 baris | Custom hooks untuk data fetching |
| `src/routes/reports.ts` | ~392 baris | API routes untuk laporan |

---

## Struktur Layout Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Title + Export CSV Button                         │
├─────────────────────────────────────────────────────────────┤
│  ROW 1: KPI Cards (4 items)                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Revenue   │ │Transaksi│ │Servis   │ │Piutang  │           │
│  │+ Growth │ │+ Growth │ │Aktif    │ │Pending  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│  ROW 2: Charts (2/3 + 1/3)                                 │
│  ┌───────────────────────────┐ ┌───────────┐                │
│  │  Area Chart (Tren)       │ │Pie Chart  │                │
│  │                           │ │Revenue    │                │
│  │                           │ ├───────────┤                │
│  │                           │ │Target     │                │
│  └───────────────────────────┘ └───────────┘                │
├─────────────────────────────────────────────────────────────┤
│  ROW 3: Operational Panels (1/2 + 1/2)                    │
│  ┌───────────────────────┐ ┌───────────────────────┐         │
│  │  Low Stock            │ │  Servis Overdue      │         │
│  │  Stok Menipis         │ │  Servis >3 Hari      │         │
│  └───────────────────────┘ └───────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ROW 4: Tables (1/2 + 1/2)                                 │
│  ┌───────────────────────┐ ┌───────────────────────┐         │
│  │  Top Products        │ │  Technician Perf.    │         │
│  │  Produk Terlaris     │ │  Performa Teknisi     │         │
│  └───────────────────────┘ └───────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

*Generated on: 2026-03-16*
