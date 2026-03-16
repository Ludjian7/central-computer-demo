import { X, Printer } from 'lucide-react';
import { useSaleDetail } from '../hooks/useSales';

interface InvoicePrintModalProps {
  saleId: number | string | null;
  onClose: () => void;
}

export default function InvoicePrintModal({ saleId, onClose }: InvoicePrintModalProps) {
  const { data: saleData, isLoading, isError } = useSaleDetail(saleId);

  if (!saleId) return null;

  const handlePrint = () => {
    window.print();
  };

  const sale = saleData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-20 pb-20 no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Cetak Invoice</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={isLoading || isError}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Struk
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Print Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {isLoading && <div className="text-center py-8">Memuat data invoice...</div>}
          {isError && <div className="text-center py-8 text-red-500">Gagal memuat invoice.</div>}
          
          {sale && (
            <div id="invoice-print-area" className="bg-white text-gray-800 p-4">
              {/* Header Invoice */}
              <div className="text-center border-b pb-4 mb-4 border-gray-300">
                <h1 className="text-2xl font-bold uppercase tracking-wider">Central Computer</h1>
                <p className="text-sm text-gray-500 mt-1">Jl. Tech Valley No. 123, Medan</p>
                <p className="text-sm text-gray-500">Telp: 0812-3456-7890 | IG: @centralcomp</p>
              </div>

              {/* Info Invoice & Customer */}
              <div className="flex justify-between text-sm mb-6">
                <div>
                  <p><span className="font-semibold">Invoice:</span> {sale.invoice_number}</p>
                  <p><span className="font-semibold">Tanggal:</span> {formatDate(sale.created_at)}</p>
                  <p><span className="font-semibold">Kasir:</span> {sale.cashier_name}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-semibold">Pelanggan:</span> {sale.customer_name || 'Umum'}</p>
                  {sale.customer_phone && <p>{sale.customer_phone}</p>}
                </div>
              </div>

              {/* Table Items */}
              <div className="w-full mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 text-left">
                      <th className="pb-2 font-semibold">Item</th>
                      <th className="pb-2 font-semibold text-center w-16">Qty</th>
                      <th className="pb-2 font-semibold text-right w-24">Harga</th>
                      <th className="pb-2 font-semibold text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 border-dashed">
                        <td className="py-2">
                          <div>{item.product_name}</div>
                          {item.discount > 0 && <div className="text-xs text-green-600">Diskon: {formatCurrency(item.discount)}</div>}
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end text-sm">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon:</span>
                      <span>-{formatCurrency(sale.discount)}</span>
                    </div>
                  )}
                  {sale.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Pajak:</span>
                      <span>{formatCurrency(sale.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-600">Metode Bayar:</span>
                    <span className="uppercase">{sale.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="uppercase">{sale.payment_status}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p>Barang yang sudah dibeli dapat diretur dalam 7 hari dengan menunjukkan struk ini.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
