import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

const API_URL = '/purchase-orders';

export interface POItem {
  id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  received_qty?: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name?: string;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  notes: string | null;
  total_amount: number;
  expected_date: string | null;
  received_date: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: POItem[];
}

export const usePurchaseOrders = (filters?: any) => {
  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: async () => {
      const response = await api.get(`${API_URL}`, { params: filters });
      return response.data.data as PurchaseOrder[];
    },
  });
};

export const usePurchaseOrderDetail = (id: number | null) => {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`${API_URL}/${id}`);
      return response.data.data as PurchaseOrder;
    },
    enabled: !!id,
  });
};

export const useCreatePO = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post(`${API_URL}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      addToast('Purchase Order berhasil dibuat', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal membuat PO', 'error');
    },
  });
};

export const useUpdatePOStatus = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await api.patch(`${API_URL}/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.id] });
      addToast('Status PO berhasil diperbarui', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal update status PO', 'error');
    },
  });
};

export const useReceiveGoods = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({ id, received_items }: { id: number; received_items: any[] }) => {
      const response = await api.post(`${API_URL}/${id}/receive`, { received_items });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-logs'] });
      addToast('Penerimaan barang berhasil dicatat', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal mencatat penerimaan barang', 'error');
    },
  });
};
