import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, X, CheckCircle2, Receipt, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCreateSale } from '../hooks/useSales';
import { useValidateDiscount } from '../hooks/useDiscounts';
import { useCurrentShift } from '../hooks/useShifts';
import { useToast } from '../context/ToastContext';
import InvoicePrintModal from '../components/InvoicePrintModal';
import { Tag as TagIcon } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface CartItem {
  product: any;
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'barang' | 'jasa'>('all');
  const [customerName, setCustomerName] = useState('');
  
  // API requests
  const apiType = filterType === 'all' ? undefined : (filterType === 'barang' ? 'physical' : 'service');
  const { data: products = [], isLoading } = useProducts({ type: apiType, q: searchTerm });
  const createSale = useCreateSale();
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [amountTendered, setAmountTendered] = useState<number | ''>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdSaleId, setCreatedSaleId] = useState<number | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Sprint 4 States
  const { data: activeShift } = useCurrentShift();
  const validateDiscount = useValidateDiscount();
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isVoucherLoading, setIsVoucherLoading] = useState(false);
  const { showToast } = useToast();

  // Filtered Products
  const filteredProducts = products;

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.11; // 11% PPN
  const discountAmount = appliedDiscount?.discount_amount || 0;
  const grandTotal = subtotal + tax - discountAmount;
  const change = typeof amountTendered === 'number' ? amountTendered - grandTotal : 0;

  // Cart Actions
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Check stock limit for physical goods
        if (product.type === 'physical' && existing.quantity >= (product.quantity || 0)) {
          return prev; // Don't add more than stock
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) return item;
        if (item.product.type === 'physical' && newQuantity > (item.product.quantity || 0)) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string | number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !activeShift) return;
    setIsPaymentModalOpen(true);
    setAmountTendered(grandTotal); // Default to exact amount
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setIsVoucherLoading(true);
    try {
      const result = await validateDiscount.mutateAsync({ code: voucherCode, subtotal });
      setAppliedDiscount(result);
      showToast(`Voucher ${result.code} berhasil diterapkan`, 'success');
    } catch (error: any) {
      setAppliedDiscount(null);
      showToast(error.response?.data?.message || 'Voucher tidak valid', 'error');
    } finally {
      setIsVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedDiscount(null);
    setVoucherCode('');
  };

  const processPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'cash' && typeof amountTendered === 'number' && amountTendered < grandTotal) {
      alert('Nominal uang tidak cukup!');
      return;
    }
    
    const items = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      subtotal: item.quantity * item.product.price
    }));

    createSale.mutate({
      customer_name: customerName.trim() || 'Umum',
      items,
      total_amount: grandTotal,
      tax_amount: tax,
      discount_amount: discountAmount,
      discount_id: appliedDiscount?.id,
      shift_id: activeShift?.id,
      payment_method: paymentMethod,
    }, {
      onSuccess: (res) => {
        if (res?.data?.saleId) {
          setCreatedSaleId(res.data.saleId);
        }
        setIsPaymentModalOpen(false);
        setIsSuccessModalOpen(true);
      }
    });
  };

  const finishTransaction = () => {
    setCart([]);
    setAmountTendered('');
    setPaymentMethod('cash');
    setIsSuccessModalOpen(false);
    setCreatedSaleId(null);
    setAppliedDiscount(null);
    setVoucherCode('');
    setCustomerName('');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Left Pane: Products Selection */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Kasir (POS)</h1>
          <p className="text-gray-500 mt-1">Pilih produk atau jasa untuk ditambahkan ke keranjang.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari produk atau jasa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200 shrink-0">
            {(['all', 'barang', 'jasa'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filterType === type 
                    ? 'bg-[#1a2b4c] text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'Semua' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar max-h-[50vh] lg:max-h-none">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
               <div className="col-span-full py-12 flex justify-center items-center text-gray-400">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#52c46a] mr-3"></div>
                 Memuat produk...
               </div>
            ) : filteredProducts.map((product: any) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer flex flex-col h-full relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${
                  product.type === 'physical' ? 'bg-blue-500' : 'bg-orange-500'
                }`}></div>
                
                <div className="mb-auto relative z-10">
                  <div className="text-xs font-mono text-gray-400 mb-2">{product.sku}</div>
                  <h3 className="font-semibold text-gray-800 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                </div>
                
                <div className="mt-4 relative z-10">
                  <div className="text-[#52c46a] font-bold font-mono text-lg">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${
                      product.type === 'physical' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {product.type === 'physical' ? 'Barang' : 'Jasa'}
                    </span>
                    {product.type === 'physical' && (
                      <span className="text-xs text-gray-500 font-mono">
                        Stok: {product.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {!isLoading && filteredProducts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ShoppingCart size={48} className="text-gray-300 mb-4" />
              <p>Tidak ada item yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Cart */}
      <div className="w-full lg:w-96 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:h-full overflow-hidden shrink-0">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#52c46a]" />
            Keranjang Pesanan
          </h2>
          <p className="text-sm text-gray-500 mt-1">Order #ORD-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div 
                key={item.product.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex gap-3 overflow-hidden"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">{item.product.name}</h4>
                  <div className="text-[#52c46a] font-mono text-sm font-medium mt-1">
                    {formatCurrency(item.product.price)}
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-between gap-2">
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-1">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-mono font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                <ShoppingCart size={24} className="text-gray-300" />
              </div>
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="p-6 bg-gray-50/80 border-t border-gray-100">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>PPN (11%)</span>
              <span className="font-mono font-medium text-gray-900">{formatCurrency(tax)}</span>
            </div>

            {/* Voucher Section */}
            <div className="pt-2 border-t border-dashed border-gray-200">
              {!appliedDiscount ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Masukan kode promo..."
                      className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button 
                    onClick={handleApplyVoucher}
                    disabled={!voucherCode || isVoucherLoading}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isVoucherLoading ? '...' : 'Cek'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-sm font-medium text-indigo-600 bg-indigo-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <TagIcon size={14} />
                    <span>{appliedDiscount.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    <button onClick={removeVoucher} className="text-red-500 hover:text-red-700">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold font-mono text-[#52c46a]">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || !activeShift || createSale.isPending}
            className="w-full bg-[#1a2b4c] hover:bg-[#111c33] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {createSale.isPending ? (
               <span className="flex items-center gap-2">Memproses... <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div></span>
            ) : (
                <>
                  <span>Bayar Sekarang</span>
                  {cart.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">{cart.length} item</span>}
                </>
            )}
          </button>
          
          {!activeShift && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
              <AlertTriangle size={16} className="shrink-0" />
              <p>
                Shift kasir belum dibuka.{' '}
                <Link to="/shifts" className="font-bold underline hover:text-amber-900 transition-colors">
                  Buka Shift →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsPaymentModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Pembayaran</h2>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={processPayment} className="p-6 overflow-y-auto custom-scrollbar">
                <div className="bg-[#1a2b4c] text-white p-6 rounded-2xl mb-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <p className="text-gray-300 text-sm mb-1 relative z-10">Total Tagihan</p>
                  <p className="text-4xl font-bold font-mono relative z-10">{formatCurrency(grandTotal)}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pelanggan (Opsional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi / Umum"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all font-medium"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cash' ? 'border-[#52c46a] bg-green-50 text-[#52c46a]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <Banknote size={24} className="mb-2" />
                      <span className="text-sm font-medium">Tunai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'transfer' ? 'border-[#52c46a] bg-green-50 text-[#52c46a]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <CreditCard size={24} className="mb-2" />
                      <span className="text-sm font-medium">Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'qris' ? 'border-[#52c46a] bg-green-50 text-[#52c46a]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <QrCode size={24} className="mb-2" />
                      <span className="text-sm font-medium">QRIS</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Uang Diterima (Rp)</label>
                      <input 
                        type="number" 
                        required
                        min={grandTotal}
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all font-mono text-lg"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* Quick Cash Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {[50000, 100000, 200000, 500000, grandTotal].map((amount, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAmountTendered(amount)}
                          className="shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-mono font-medium transition-colors"
                        >
                          {amount === grandTotal ? 'Uang Pas' : formatCurrency(amount)}
                        </button>
                      ))}
                    </div>

                    {typeof amountTendered === 'number' && amountTendered >= grandTotal && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                        <span className="text-blue-800 font-medium">Kembalian:</span>
                        <span className="text-xl font-bold font-mono text-blue-700">{formatCurrency(change)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <button 
                    type="submit"
                    className="w-full px-6 py-4 bg-[#52c46a] hover:bg-[#45a659] text-white font-bold text-lg rounded-xl transition-colors shadow-sm"
                  >
                    Proses Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-[#52c46a]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Berhasil!</h2>
              <p className="text-gray-500 mb-8">Pembayaran telah diterima dan dicatat ke dalam sistem.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="w-full px-6 py-3.5 bg-[#1a2b4c] hover:bg-[#111c33] text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Receipt size={18} />
                  Cetak Struk
                </button>
                <button 
                  onClick={finishTransaction}
                  className="w-full px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Transaksi Baru
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isPrintModalOpen && createdSaleId && (
        <InvoicePrintModal
          saleId={createdSaleId}
          onClose={() => {
            setIsPrintModalOpen(false);
            finishTransaction(); // Auto restart after print dialog is closed
          }}
        />
      )}
    </div>
  );
}
