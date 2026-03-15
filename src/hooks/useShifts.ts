import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export interface CashShift {
  id: number;
  user_id: number;
  cashier_name?: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  system_cash: number | null;
  notes: string | null;
  status: 'open' | 'closed';
}

export interface ShiftReport {
  shift: CashShift;
  summary: {
    payment_method: string;
    transactions: number;
    revenue: number;
  }[];
  transactions: {
    id: number;
    invoice_number: string;
    total: number;
    payment_method: string;
    created_at: string;
  }[];
}

export function useCurrentShift() {
  const token = localStorage.getItem('token');
  return useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: async () => {
      const response = await api.get('/shifts/current');
      return response.data.data as CashShift | null;
    },
    enabled: !!token
  });
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await api.get('/shifts');
      return response.data.data as CashShift[];
    }
  });
}

export function useShiftReport(id: number | null) {
  return useQuery({
    queryKey: ['shifts', id, 'report'],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/shifts/${id}/report`);
      return response.data.data as ShiftReport;
    },
    enabled: !!id
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: { opening_cash: number; notes?: string }) => {
      const response = await api.post('/shifts/open', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      showToast('Shift berhasil dibuka', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Gagal membuka shift', 'error');
    }
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: { closing_cash: number; notes?: string }) => {
      const response = await api.post('/shifts/close', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      showToast('Shift berhasil ditutup', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Gagal menutup shift', 'error');
    }
  });
}
