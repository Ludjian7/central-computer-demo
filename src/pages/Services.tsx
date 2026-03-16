import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  User, 
  Laptop, 
  Phone,
  Calendar,
  MoreVertical,
  X,
  Edit,
  Trash2,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useServices, useUpdateServiceStatus, useAssignTechnician, useTechnicians } from '../hooks/useServices';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

const statusConfig: Record<string, any> = {
  scheduled: { label: 'Menunggu', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  in_progress: { label: 'Dikerjakan', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Wrench },
  completed: { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Batal', color: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle },
};

export default function Services() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  
  // Custom Hooks
  const { data: services = [], isLoading } = useServices({ status: filterStatus === 'all' ? undefined : filterStatus });
  const { data: users = [] } = useTechnicians();
  const updateStatus = useUpdateServiceStatus();
  const assignTech = useAssignTechnician();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'update_status'>('update_status');
  const [currentTicket, setCurrentTicket] = useState<any>({});

  const filteredServices = useMemo(() => {
    return services.filter((s: any) => {
      const q = searchTerm.toLowerCase();
      return (
        String(s.invoice_number).toLowerCase().includes(q) || 
        String(s.customer_name).toLowerCase().includes(q) ||
        String(s.product_name).toLowerCase().includes(q)
      );
    });
  }, [services, searchTerm]);

  const openStatusModal = (ticket: any) => {
    setModalMode('update_status');
    setCurrentTicket({ ...ticket });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'update_status') {
      updateStatus.mutate({ id: currentTicket.id, status: currentTicket.service_status });
      if (currentTicket.service_technician !== undefined && currentTicket.service_technician !== '') {
        assignTech.mutate({ id: currentTicket.id, technician_id: parseInt(currentTicket.service_technician) });
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Servis</h1>
          <p className="text-gray-500 mt-1">Lacak status perbaikan perangkat pelanggan.</p>
        </div>
        <button 
          onClick={() => navigate('/pos')}
          className="bg-[#52c46a] hover:bg-[#45a659] text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Terima Servis Baru (POS)</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari ID, nama pelanggan, atau perangkat..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
          />
        </div>
        <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-2 custom-scrollbar shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
              filterStatus === 'all' ? 'bg-[#1a2b4c] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semua
          </button>
          {(Object.keys(statusConfig)).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                filterStatus === status 
                  ? statusConfig[status].color.split(' ')[0] + ' ' + statusConfig[status].color.split(' ')[1] + ' border border-transparent'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
              }`}
            >
              {React.createElement(statusConfig[status].icon, { size: 14 })}
              {statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban / Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {isLoading ? (
             <div className="col-span-full">
               <LoadingSkeleton />
             </div>
          ) : filteredServices.map((ticket: any) => {
            const currentStatus = statusConfig[ticket.service_status] || statusConfig['scheduled'];
            const StatusIcon = currentStatus.icon;
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={ticket.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                  <div>
                    <span className="text-xs font-mono text-gray-500 mb-1 block">#{ticket.invoice_number}</span>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${currentStatus.color}`}>
                      <StatusIcon size={12} />
                      {currentStatus.label}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.customer_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Phone size={12} />
                        <span className="font-mono">{ticket.customer_phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Laptop size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-sm font-medium text-gray-900">{ticket.product_name}</span>
                      <span className="block text-sm text-gray-500 mt-0.5">{ticket.notes || 'Tidak ada catatan'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar size={14} />
                      <span>{formatDate(ticket.service_schedule)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {ticket.technician_name ? ticket.technician_name.substring(0,2).toUpperCase() : '?'}
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {ticket.technician_name || 'Belum ditugaskan'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => openStatusModal(ticket)}
                      className="text-xs font-medium text-[#52c46a] hover:text-[#45a659] bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors border border-green-200"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!isLoading && filteredServices.length === 0 && (
        <div className="py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
          <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p>Tidak ada tiket servis yang ditemukan.</p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-800">
                  Update Status Servis
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                {modalMode === 'update_status' && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                      <div className="text-xs font-mono text-gray-500 mb-1">#{currentTicket.invoice_number}</div>
                      <div className="font-semibold text-gray-900">{currentTicket.product_name}</div>
                      <div className="text-sm text-gray-600 mt-1">{currentTicket.customer_name}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Servis</label>
                      <select 
                        value={currentTicket.service_status}
                        onChange={(e) => setCurrentTicket({...currentTicket, service_status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
                      >
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Teknisi Bertugas</label>
                        <select 
                          value={currentTicket.service_technician || ''}
                          onChange={(e) => setCurrentTicket({...currentTicket, service_technician: e.target.value})}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
                        >
                          <option value="">-- Pilih Teknisi --</option>
                          {users
                            .filter((u: any) => u.role === 'karyawan') // Admin can assign to karyawan (technicians)
                            .map((tech: any) => (
                            <option key={tech.id} value={tech.id}>{tech.username}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-[#52c46a] hover:bg-[#45a659] text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
