# Laporan Fitur POS (Point of Sales)

## Ringkasan

Halaman POS (Point of Sales) adalah fitur utama aplikasi untuk melakukan transaksi penjualan langsung (cashier). Aplikasi ini dirancang untuk bisnis retail produk elektronik dan jasa servis dengan dukungan pembayaran tunai, transfer, dan QRIS.

---

## Fitur-Fitur POS

### 1. SELEKSI PRODUK & JASA

Halaman POS menampilkan grid produk/jasa yang dapat dipilih untuk ditambahkan ke keranjang.

| Fitur | Deskripsi |
|-------|-----------|
| **Search** | Pencarian produk/jasa berdasarkan nama atau SKU |
| **Filter Tipe** | Filter menampilkan: Semua, Barang (physical), Jasa (service) |
| **Product Grid** | Tampilan grid responsif (2-4 kolom) |
| **Product Card** | Menampilkan: SKU, Nama, Harga, Tipe, Stok (untuk barang) |
| **Stock Warning** | Batas maksimal quantity berdasarkan stok tersedia |

#### Detail Product Card
- **Tampilan**: Nama produk, harga, tipe (barang/jasa), stok
- **Warna indicator**: Biru untuk barang, Orange untuk jasa
- **Interaksi**: Click untuk tambah ke keranjang
- **Animasi**: Hover effect dan tap scale

---

### 2. KERANJANG PESANAN (CART)

Panel kanan yang menampilkan item yang dipilih.

| Fitur | Deskripsi |
|-------|-----------|
| **Order Number** | Nomor order acak (format: ORD-XXXX) |
| **Item List** | Daftar produk dengan quantity |
| **Quantity Control** | Tombol + / - untuk ubah jumlah |
| **Remove Item** | Tombol hapus item dari keranjang |
| **Empty State** | Tampilan saat keranjang kosong |

#### Kalkulasi Keranjang
| Komponen | Rumus |
|----------|-------|
| Subtotal | Σ (harga × quantity) |
| PPN | 11% dari subtotal |
| Diskon | Nilai voucher (jika diterapkan) |
| Total | Subtotal + PPN - Diskon |

---

### 3. SISTEM VOUCHER / DISKON

Fitur untuk menerapkan kode promo/voucher pada transaksi.

| Fitur | Deskripsi |
|-------|-----------|
| **Kode Input** | Input untuk memasukkan kode voucher |
| **Validasi** | Cek validitas voucher via API |
| **Tipe Diskon** | Potongan nominal (discount_amount) |
| **Display** | Menampilkan nama voucher dan nilai diskon |
| **Remove** | Tombol hapus voucher yang diterapkan |

#### Logika Diskon
```typescript
const handleApplyVoucher = async () => {
  const result = await validateDiscount.mutateAsync({ 
    code: voucherCode, 
    subtotal 
  });
  setAppliedDiscount(result);
};
```

---

### 4. MODAL PEMBAYARAN

Modal yang muncul saat klik "Bayar Sekarang".

#### 4.1 Informasi Transaksi
- **Total Tagihan**: Grand total dengan format mata uang IDR
- **Nama Pelanggan**: Input opsional untuk nama customer

#### 4.2 Metode Pembayaran
Tiga opsi pembayaran tersedia:

| Metode | Icon | Keterangan |
|--------|------|------------|
| Tunai (Cash) | Banknote | Menggunakan uang fisik |
| Transfer | CreditCard | Pembayaran via transfer bank |
| QRIS | QrCode | Pembayaran via QR Code |

#### 4.3 Pembayaran Tunai
Jika metode "Tunai" dipilih:

| Fitur | Deskripsi |
|-------|-----------|
| **Input Amount** | Input nominal uang diterima |
| **Quick Buttons** | Tombol cepat: Rp 50.000, 100.000, 200.000, 500.000, "Uang Pas" |
| **Change Calc** | Hitung kembalian otomatis |
| **Validation** | Validasi uang diterima ≥ total tagihan |

#### 4.4 Proses Transaksi
- Submit form untuk proses pembayaran
- Validasi shift harus terbuka
- Mengirim data ke API `useCreateSale`

---

### 5. SHIFT MANAGEMENT

Sistem pengelolaan kasir (shift) untuk keamanan transaksi.

| Fitur | Deskripsi |
|-------|-----------|
| **Shift Check** | Cek apakah shift kasir sedang aktif |
| **Required** | Transaksi tidak dapat dilakukan tanpa shift terbuka |
| **Error Handling** | Tampilkan toast error jika shift belum dibuka |

#### Logika Validasi Shift
```typescript
if (!activeShift) {
  showToast('Anda harus membuka shift kasir terlebih dahulu!', 'error');
  return;
}
```

---

### 6. MODAL SUKSES

Tampilan setelah transaksi berhasil.

| Fitur | Deskripsi |
|-------|-----------|
| **Success Icon** | Check-circle hijau |
| **Message** | "Transaksi Berhasil!" |
| **Cetak Struk** | Tombol untuk membuka modal print invoice |
| **Transaksi Baru** | Tombol untuk reset dan mulai transaksi baru |

#### Flow Setelah Sukses
1. Tampilkan modal sukses
2. User pilih: Cetak struk atau Transaksi baru
3. Jika cetak: Buka `InvoicePrintModal`
4. Jika baru: Reset semua state (cart, voucher, dll)

---

### 7. PRINT INVOICE

Fitur untuk mencetak struk transaksi.

| Fitur | Deskripsi |
|-------|-----------|
| **Modal Print** | Popup untuk print invoice |
| **Sale ID** | ID transaksi yang akan dicetak |
| **Auto Restart** | Reset transaction setelah modal ditutup |

---

## Struktur Data

### 1. Cart Item Interface
```typescript
interface CartItem {
  product: any;
  quantity: number;
}
```

### 2. Sale Creation Payload
```typescript
{
  customer_name: string,      // Nama customer atau "Umum"
  items: [
    {
      product_id: number,
      quantity: number,
      price: number,
      subtotal: number
    }
  ],
  total_amount: number,        // Grand total
  tax_amount: number,         // PPN (11%)
  discount_amount: number,    // Nilai diskon
  discount_id: number | null, // ID voucher
  shift_id: number,           // ID shift aktif
  payment_method: string      // 'cash' | 'transfer' | 'qris'
}
```

---

## API yang Digunakan

| Hook | Endpoint | Parameter |
|------|----------|-----------|
| `useProducts` | `GET /api/products` | type, q (search) |
| `useCreateSale` | `POST /api/sales` | sale data |
| `useValidateDiscount` | `POST /api/discounts/validate` | code, subtotal |
| `useCurrentShift` | `GET /api/shifts/current` | - |

---

## Tech Stack

- **Frontend**: React + TypeScript
- **Animasi**: Framer Motion (motion/react)
- **Icons**: Lucide React
- **State Management**: React useState
- **Data Fetching**: TanStack Query (via hooks)
- **Toast Notifications**: Custom ToastContext

---

## Estimasi Kode

| File | Estimasi Baris | Deskripsi |
|------|----------------|-----------|
| `src/pages/POS.tsx` | ~591 baris | Komponen utama POS |
| `src/components/InvoicePrintModal.tsx` | ~150 baris | Modal print invoice |
| `src/hooks/useSales.ts` | ~80 baris | Hook untuk penjualan |
| `src/hooks/useProducts.ts` | ~30 baris | Hook untuk produk |
| `src/hooks/useDiscounts.ts` | ~40 baris | Hook untuk diskon |
| `src/hooks/useShifts.ts` | ~80 baris | Hook untuk shift |

---

## Layout Struktur POS

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "Kasir (POS)" + Deskripsi                             │
├─────────────────────────────────────────────────────────────────┤
│  SEARCH BAR                        │ FILTER TABS              │
│  [Cari produk atau jasa...]        │ [Semua] [Barang] [Jasa]  │
├─────────────────────────────────────┴───────────────────────────│
│                                                                 │
│  PRODUCT GRID (Left Pane - 75%)    │  CART PANEL (Right 25%)  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │  ┌────────────────────┐  │
│  │ Prod│ │ Prod│ │ Prod│ │ Prod│ │  │ Order #ORD-XXXX    │  │
│  │  1  │ │  2  │ │  3  │ │  4  │ │  ├────────────────────┤  │
│  └─────┘ └─────┘ └─────┘ └─────┘ │  │ Item 1    [+] [-]  │  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │  │ Item 2    [+] [-]  │  │
│  │ Prod│ │ Prod│ │ Prod│ │ Prod│ │  │ Item 3    [+] [-]  │  │
│  │  5  │ │  6  │ │  7  │ │  8  │ │  ├────────────────────┤  │
│  └─────┘ └─────┘ └─────┘ └─────┘ │  │ Subtotal: Rp XXX   │  │
│                                   │  │ PPN 11%:  Rp XXX   │  │
│                                   │  │ Diskon:   -Rp XXX   │  │
│                                   │  │ ─────────────────── │  │
│                                   │  │ TOTAL:     Rp XXX   │  │
│                                   │  │                    │  │
│                                   │  │ [BAYAR SEKARANG]    │  │
│                                   │  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

PAYMENT MODAL (Overlay):
┌────────────────────────────────────────┐
│  Pembayaran                    [X]    │
│  ┌──────────────────────────────────┐ │
│  │     TOTAL TAGIHAN                │ │
│  │     Rp 1.500.000                │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Nama Pelanggan: [_____________]      │
│                                        │
│  Metode Pembayaran:                   │
│  [Tunai] [Transfer] [QRIS]            │
│                                        │
│  (Jika Tunai):                        │
│  Uang Diterima: [_____________]       │
│  [50rb] [100rb] [200rb] [500rb] [Pas]  │
│  Kembalian: Rp XXX                    │
│                                        │
│  [PROSES TRANSAKSI]                   │
└────────────────────────────────────────┘
```

---

## Fitur Keamanan

1. **Shift Validation**: Transaksi hanya bisa dilakukan jika shift kasir terbuka
2. **Stock Validation**: Quantity barang tidak bisa melebihi stok tersedia
3. **Payment Validation**: Uang diterima harus ≥ total tagihan (untuk cash)

---

## Catatan Penting

1. **NPWP**: Sistem belum menampilkan NPWP di invoice
2. **Invoice Number**: Menggunakan format acak, belum ada format tetap
3. **QRIS**: Fitur QRIS tersedia tapi tidak ada implementasi generate QR
4. **Print**: Menggunakan window.print atau custom modal

---

*Generated on: 2026-03-16*
