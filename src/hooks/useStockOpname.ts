import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export interface StockOpname {
  id: number;
  opname_date: string;
  status: 'draft' | 'in_progress' | 'completed';
  notes: string;
  creator_name: string;
  completed_at: string | null;
  created_at: string;
}

export interface StockOpnameItem {
  id: number;
  opname_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  category: string;
  system_qty: number;
  physical_qty: number | null;
  difference: number | null;
  adjustment_notes: string | null;
}

export interface StockOpnameDetail extends StockOpname {
  items: StockOpnameItem[];
}

export function useStockOpnames() {
  return useQuery({
    queryKey: ['stock-opnames'],
    queryFn: async () => {
      const response = await api.get('/stock-opname');
      return response.data.data;
    }
  });
}

export function useStockOpnameDetail(id: number | null) {
  return useQuery({
    queryKey: ['stock-opname', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/stock-opname/${id}`);
      return response.data.data as StockOpnameDetail;
    },
    enabled: !!id
  });
}

export function useCreateStockOpname() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: { notes?: string; opname_date?: string }) => {
      const response = await api.post('/stock-opname', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] });
      showToast('Draft Stock Opname berhasil dibuat', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Gagal membuat draft opname', 'error');
    }
  });
}

export function useUpdateStockOpnameItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ opnameId, productId, physicalQty, notes }: { opnameId: number; productId: number; physicalQty: number; notes? : string }) => {
      const response = await api.patch(`/stock-opname/${opnameId}/item`, {
        product_id: productId,
        physical_qty: physicalQty,
        notes
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opname', variables.opnameId] });
    }
  });
}

export function useCompleteStockOpname() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/stock-opname/${id}/complete`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] });
      queryClient.invalidateQueries({ queryKey: ['stock-opname', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Stock Opname berhasil diselesaikan', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Gagal menyelesaikan opname', 'error');
    }
  });
}
