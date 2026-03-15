import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export interface Discount {
  id: number;
  code: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: number;
  created_at: string;
}

export function useDiscounts() {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const response = await api.get('/discounts');
      return response.data.data as Discount[];
    }
  });
}

export function useValidateDiscount() {
  return useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal: number }) => {
      const response = await api.post('/discounts/validate', { code, subtotal });
      return response.data.data;
    }
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/discounts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      showToast('Promo berhasil dibuat', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Gagal membuat promo', 'error');
    }
  });
}

export function useToggleDiscount() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch(`/discounts/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      showToast('Status promo berhasil diubah', 'success');
    }
  });
}
