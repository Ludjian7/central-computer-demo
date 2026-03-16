# Laporan Fitur Aplikasi POS - Semua Halaman

## Ringkasan

Dokumen ini berisi analisis lengkap semua fitur yang tersedia di aplikasi POS (Point of Sale) Central Computer. Aplikasi ini mencakup berbagai modul untuk mengelola penjualan, inventaris, servis, laporan, dan pengaturan sistem.

---

## Daftar Halaman

| No | Halaman | Path | Roles |
|----|---------|------|-------|
| 1 | Dashboard | `/dashboard` | admin, owner |
| 2 | Point of Sales (POS) | `/pos` | admin, owner, karyawan |
| 3 | Servis & Jasa | `/services` | admin, owner, karyawan |
| 4 | Produk | `/products` | admin, owner |
| 5 | Supplier | `/suppliers` | admin, owner |
| 6 | Purchase Orders | `/purchase-orders` | admin, owner |
| 7 | Transaksi | `/sales` | admin, owner |
| 8 | Retur | `/returns` | admin, owner |
| 9 | Stock Opname | `/stock-opname` | admin, owner |
| 10 | Diskon & Promo | `/discounts` | admin, owner |
| 11 | Shift Kasir | `/shifts` | admin, owner |
| 12 | Laporan | `/reports` | admin, owner |
| 13 | Pengaturan | `/settings` | admin, owner |

---

# Detail Fitur per Halaman

---

## 1. Dashboard

**File**: `src/pages/Dashboard.tsx` (~563 baris)

### Deskripsi
Halaman utama yang menampilkan ringkasan performa bisnis secara real-time.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **KPI Cards** | 4 metrik utama: Pendapatan, Transaksi, Servis Aktif, Piutang Pending |
| **Area Chart** | Tren penjualan harian (30 hari) |
| **Pie Chart** | Pembagian revenue (Produk vs Servis) |
| **Progress Target** | Pencapaian target bulanan |
| **Low Stock Panel** | Produk dengan stok di bawah minimum |
| **Servis Overdue** | Servis >3 hari belum selesai |
| **Top Products** | Produk/jasa terlaris |
| **Performa Teknisi** | Statistik penyelesaian servis |
| **Export CSV** | Export laporan penjualan |

### API yang Digunakan
- `useReportsSummary`
- `useReportsSalesTrend`
- `useTopProducts`
- `useTechnicianPerformance`
- `useLowStockReport`
- `useServiceAging`
- `useExportSalesCSV`

---

## 2. Point of Sales (POS)

**File**: `src/pages/POS.tsx` (~591 baris)

### Deskripsi
Halaman kasir untuk melakukan transaksi penjualan langsung.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Product Grid** | Tampilan produk/jasa dalam grid responsif |
| **Search & Filter** | Pencarian dan filter tipe (barang/jasa/semua) |
| **Keranjang** | Manajemen item yang akan dibeli |
| **Kalkulasi Otomatis** | Subtotal, PPN (11%), diskon, total |
| **Voucher System** | Input dan validasi kode promo |
| **Modal Pembayaran** | Pilih metode: Tunai, Transfer, QRIS |
| **Quick Cash Buttons** | Tombol cepat nominal uang |
| **Hitung Kembalian** | Kalkulasi kembalian otomatis |
| **Validasi Shift** | Transaksi wajib dengan shift terbuka |
| **Success Modal** | Konfirmasi transaksi berhasil |
| **Print Invoice** | Cetak struk transaksi |

### API yang Digunakan
- `useProducts`
- `useCreateSale`
- `useValidateDiscount`
- `useCurrentShift`
- `useExportSalesCSV`

---

## 3. Servis & Jasa

**File**: `src/pages/Services.tsx` (~320 baris)

### Deskripsi
Halaman manajemen servis dan perbaikan perangkat pelanggan.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Service Cards** | Tampilan servis dalam format card/kanban |
| **Search** | Pencarian berdasarkan invoice, customer, produk |
| **Filter Status** | Filter: Semua, Menunggu, Dikerjakan, Selesai, Batal |
| **Status Servis** | 4 status: scheduled, in_progress, completed, cancelled |
| **Detail Servis** | Info customer, produk, catatan, teknisi |
| **Update Status** | Ubah status servis via modal |
| **Assign Teknisi** | Penugasan teknisi (admin/owner) |
| **Quick Action** | Tombol ke POS untuk servis baru |

### API yang Digunakan
- `useServices`
- `useUpdateServiceStatus`
- `useAssignTechnician`
- `useTechnicians`

---

## 4. Produk

**File**: `src/pages/Products.tsx` (~369 baris)

### Deskripsi
Halaman pengelolaan inventaris barang dan jasa.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Product Table** | Tampilan data produk dalam tabel |
| **Search** | Pencarian produk berdasarkan nama/ID |
| **Filter Tipe** | Filter: Semua, Barang Fisik, Jasa |
| **Tambah Produk** | Modal untuk tambah item baru |
| **Edit Produk** | Modal untuk edit item |
| **Hapus/Nonaktifkan** | Nonaktifkan produk |
| **Status Stok** | Indikator: Aktif, Menipis, Habis |
| **Buat PO** | Quick action ke Purchase Order |
| **Auto SKU** | Generate SKU otomatis |

### API yang Digunakan
- `useProducts`
- `useMutateProduct`
- `useDeactivateProduct`

### Komponen Pendukung
- `PurchaseOrderModal`

---

## 5. Supplier

**File**: `src/pages/Suppliers.tsx` (~288 baris)

### Deskripsi
Halaman pengelolaan daftar pemasok/supplier barang.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Supplier Cards** | Tampilan supplier dalam format card |
| **Search** | Pencarian nama supplier atau kontak |
| **Tambah Supplier** | Modal untuk tambah supplier baru |
| **Edit Supplier** | Modal untuk edit data supplier |
| **Hapus Supplier** | Delete data supplier |
| **Detail Info** | Nama perusahaan, PIC, telepon, email, alamat |

### Catatan
- Menggunakan **Mock Data** (data statis, belum terintegrasi API)
- Data tersimpan di state lokal

---

## 6. Purchase Orders

**File**: `src/pages/PurchaseOrders.tsx` (~214 baris)

### Deskripsi
Halaman manajemen pengadaan barang dari supplier.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **PO Table** | Tampilan Purchase Order dalam tabel |
| **Search** | Pencarian nomor PO atau supplier |
| **Filter Status** | Filter: Semua, Draft, Dikirim, Sebagian, Selesai, Batal |
| **Status Badge** | Indikator visual status PO |
| **Timeline** | Tanggal dibuat, ekspektasi, diterima |
| **Buat PO Baru** | Membuat Purchase Order baru |
| **Kirim PO** | Ubah status draft → dikirim |
| **Terima Barang** | Proses penerimaan barang (partial/full) |
| **Batalkan PO** | Batalkan PO yang belum selesai |

### Status PO
| Status | Deskripsi |
|--------|-----------|
| draft | Masih dalam konsep |
| sent | PO sudah dikirim ke supplier |
| partial | Diterima sebagian |
| received | Selesai diterima |
| cancelled | Dibatalkan |

### API yang Digunakan
- `usePurchaseOrders`
- `useUpdatePOStatus`

### Komponen Pendukung
- `PurchaseOrderModal`
- `ReceiveGoodsModal`

---

## 7. Transaksi (Riwayat Penjualan)

**File**: `src/pages/Sales.tsx` (~204 baris)

### Deskripsi
Halaman menampilkan riwayat semua transaksi penjualan.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Sales Table** | Tampilan transaksi dalam tabel |
| **Search** | Pencarian invoice atau nama pelanggan |
| **Filter Tanggal** | Filter berdasarkan periode |
| **Status Pembayaran** | Indikator: Lunas, Parsial, Belum Bayar |
| **Update Status** | Ubah status pembayaran via dropdown |
| **Cetak Invoice** | Print struk transaksi |
| **Retur Barang** | Proses retur untuk transaksi lunas/parsial |
| **Export CSV** | Export data penjualan |

### Status Pembayaran
| Status | Label |
|--------|-------|
| paid | Lunas |
| partial | Parsial |
| unpaid | Belum Bayar |

### API yang Digunakan
- `useSales`
- `useUpdatePaymentStatus`
- `useExportSalesCSV`

### Komponen Pendukung
- `InvoicePrintModal`
- `ReturnModal`

---

## 8. Retur

**File**: `src/pages/Returns.tsx` (~96 baris)

### Deskripsi
Halaman menampilkan riwayat pengembalian barang.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Returns Table** | Tampilan data retur dalam tabel |
| **Kolom Data** | Tanggal retur, No Invoice, Produk, Qty, Alasan, Refund, Metode, Oleh |
| **Info Refund** | Jumlah refund dan metode pengembalian |
| **Processed By** | User yang memproses retur |

### API yang Digunakan
- `useReturns`

---

## 9. Stock Opname

**File**: `src/pages/StockOpname.tsx` (~240 baris)

### Deskripsi
Halaman untuk pencocokan stok fisik dengan sistem.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Opname List** | Tampilan riwayat stock opname |
| **Buat Opname** | Membuat draft opname baru |
| **Detail Opname** | Lihat detail produk dalam opname |
| **Input Stok Fisik** | Input jumlah stok fisik untuk setiap produk |
| **Selisih Kalkulasi** | Hitung selisih sistem vs fisik |
| **Selesaikan Opname** | Finalisasi opname, update stok sistem |
| **Status Opname** | Draft, Proses, Selesai |

### Workflow Stock Opname
1. Buat Draft Opname → snapshot stok saat ini
2. Input stok fisik untuk setiap produk
3. Sistem hitung selisih
4. Selesaikan opname → update stok永久

### API yang Digunakan
- `useStockOpnames`
- `useCreateStockOpname`
- `useStockOpnameDetail`
- `useUpdateStockOpnameItem`
- `useCompleteStockOpname`

---

## 10. Diskon & Promo

**File**: `src/pages/Discounts.tsx` (~320 baris)

### Deskripsi
Halaman pengelolaan voucher dan promo discount.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Discounts Table** | Tampilan daftar promo dalam tabel |
| **Search** | Pencarian kode atau nama promo |
| **Buat Promo** | Modal untuk membuat promo baru |
| **Tipe Diskon** | Persentase (%) atau Nominal Tetap (Rp) |
| **Nilai Diskon** | Besar diskon yang diberikan |
| **Min Purchase** | Minimal belanja untuk qualify |
| **Max Discount** | Batasan maksimal diskon (untuk %) |
| **Usage Limit** | Kuota penggunaan promo |
| **Valid Period** | Tanggal mulai dan akhir promo |
| **Toggle Status** | Aktifkan/Nonaktifkan promo |
| **Usage Progress** | Visualisasi penggunaan vs limit |

### API yang Digunakan
- `useDiscounts`
- `useCreateDiscount`
- `useToggleDiscount`

---

## 11. Shift Kasir

**File**: `src/pages/Shifts.tsx` (~221 baris)

### Deskripsi
Halaman pemantauan dan laporan shift kasir.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Shift List** | Daftar shift terbaru (sidebar) |
| **Shift Detail** | Detail shift yang dipilih |
| **Shift Info** | Waktu buka/tutup, kasir, modal awal |
| **Rekap Pendapatan** | Breakdown per metode pembayaran |
| **Closing Check** | Perbandingan kas sistem vs fisik |
| **Selisih Kas** | Hitung selisih (minus/plus) |
| **Daftar Transaksi** | List transaksi dalam shift |
| **Status Shift** | Terbuka (open) atau Selesai (closed) |

### Metode Pembayaran
- Cash (Tunai)
- Transfer
- QRIS

### API yang Digunakan
- `useShifts`
- `useShiftReport`

---

## 12. Laporan (Laporan Laba Rugi)

**File**: `src/pages/Reports.tsx` (~178 baris)

### Deskripsi
Halaman analisis laporan keuangan dan profitabilitas.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Date Range** | Filter laporan berdasarkan tanggal |
| **KPI Cards** | Total Pendapatan, Total HPP, Laba Kotor |
| **Margin Indicator** | Persentase gross margin |
| **Bar Chart** | Tren Pendapatan vs HPP per periode |
| **Category Table** | Breakdown laba per kategori |
| **Margin Progress** | Visualisasi margin per kategori |
| **Export CSV** | Export laporan keuangan |

### Metrik Utama
| Metrik | Deskripsi |
|--------|-----------|
| Total Revenue | Total pendapatan bruto |
| Total COGS | Total Cost of Goods Sold (HPP) |
| Gross Profit | Laba Kotor (Revenue - COGS) |
| Gross Margin % | Persentase keuntungan |

### API yang Digunakan
- `useProfitLoss`

---

## 13. Pengaturan

**File**: `src/pages/Settings.tsx` (~186 baris)

### Deskripsi
Halaman konfigurasi profil toko dan sistem.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Profil Toko** | Nama, Alamat, Nomor Telepon |
| **Keuangan & Pajak** | PPN, Simbol Mata Uang |
| **Target Bulanan** | Target pendapatan bulanan |
| **Save Changes** | Simpan pengaturan |
| **Reset Form** | Reset form ke nilai awal |

### Field Pengaturan
| Field | Deskripsi |
|-------|-----------|
| store_name | Nama toko |
| store_address | Alamat lengkap |
| store_phone | Nomor telepon |
| tax_ppn | Persentase PPN |
| currency_symbol | Simbol mata uang |
| monthly_target | Target pendapatan bulanan |

### API yang Digunakan
- `useSettings`
- `useUpdateSettings`

---

## Ringkasan Teknis

### Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Frontend | React + TypeScript |
| Animasi | Framer Motion |
| Charting | Recharts |
| Icons | Lucide React |
| Routing | React Router DOM |
| Data Fetching | TanStack Query |
| Date Handling | date-fns |
| Styling | Tailwind CSS |

### Estimasi Total Baris Kode

| Halaman | Estimasi Baris |
|---------|---------------|
| Dashboard | ~563 |
| POS | ~591 |
| Services | ~320 |
| Products | ~369 |
| Suppliers | ~288 |
| PurchaseOrders | ~214 |
| Sales | ~204 |
| Returns | ~96 |
| StockOpname | ~240 |
| Discounts | ~320 |
| Shifts | ~221 |
| Reports | ~178 |
| Settings | ~186 |
| **Total** | **~4,290** |

---

## Catatan Penting

1. **Supplier**: Menggunakan mock data, belum terintegrasi dengan API backend
2. **Roles**: Beberapa halaman dibatasi hanya untuk role admin/owner
3. **Shift Required**: Transaksi POS memerlukan shift kasir terbuka
4. **PPN**: Default 11%, dikonfigurasi di Settings
5. **Stock Opname**: Once completed, cannot be undone - akan update stok sistem

---

*Generated on: 2026-03-16*
