import React, { useState } from 'react';
import { useCurrentShift, useOpenShift, useCloseShift } from '../hooks/useShifts';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, Clock, Wallet } from 'lucide-react';

export const ShiftBanner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: shift, isLoading } = useCurrentShift();
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Batasan role: Hanya karyawan (kasir) yang butuh melihat status shift
  const allowedRoles = ['karyawan'];
  
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) return null;
  if (isLoading) return null;

  return (
    <>
      <div className={`px-4 py-2 flex items-center justify-between text-sm ${shift ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-800 border-b border-amber-200'}`}>
        <div className="flex items-center gap-4">
          {shift ? (
            <>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4" />
                <span>Shift Aktif: {new Date(shift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-90">
                <Wallet className="w-4 h-4" />
                <span>Modal Awal: Rp {shift.opening_cash.toLocaleString('id-ID')}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Shift belum dibuka. Silakan buka shift untuk mulai bertransaksi.</span>
            </div>
          )}
        </div>

        <button
          onClick={() => shift ? setShowCloseModal(true) : setShowOpenModal(true)}
          className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            shift 
              ? 'bg-white text-indigo-600 hover:bg-indigo-50' 
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {shift ? (
            <>
              <LogOut className="w-3.5 h-3.5" />
              <span>Tutup Shift</span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5" />
              <span>Buka Shift</span>
            </>
          )}
        </button>
      </div>

      {showOpenModal && (
        <OpenShiftModal onClose={() => setShowOpenModal(false)} />
      )}
      {showCloseModal && shift && (
        <CloseShiftModal shift={shift} onClose={() => setShowCloseModal(false)} />
      )}
    </>
  );
};

interface OpenShiftModalProps {
  onClose: () => void;
}

const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ onClose }) => {
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const openShift = useOpenShift();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openShift.mutate({ opening_cash: openingCash, notes }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 text-slate-800">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold">Buka Shift Kasir</h3>
          <p className="text-slate-500 text-sm mt-1">Masukkan sisa uang kas kemarin sebagai modal awal.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Modal Awal Kas (Tunai)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
              <input
                type="number"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="0"
                value={openingCash || ''}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={openShift.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {openShift.isPending ? 'Memproses...' : 'Buka Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CloseShiftModalProps {
  shift: any;
  onClose: () => void;
}

const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ shift, onClose }) => {
  const [closingCash, setClosingCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const closeShift = useCloseShift();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeShift.mutate({ closing_cash: closingCash, notes }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 text-slate-800">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold">Tutup Shift Kasir</h3>
          <p className="text-slate-500 text-sm mt-1">Pastikan semua transaksi kas telah terhitung.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Terbuka Sejak:</span>
              <span className="font-medium">{new Date(shift.opened_at).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-indigo-100 pt-2">
              <span className="text-slate-600">Modal Awal:</span>
              <span className="font-medium text-indigo-700">Rp {shift.opening_cash.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Uang Kas Akhir (Fisik)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
              <input
                type="number"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="0"
                value={closingCash || ''}
                onChange={(e) => setClosingCash(Number(e.target.value))}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">*Jangan termasuk uang di rekening/transfer</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Akhir</label>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Ada selisih Rp 5.000 karena tidak ada receh"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={closeShift.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {closeShift.isPending ? 'Memproses...' : 'Tutup Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
