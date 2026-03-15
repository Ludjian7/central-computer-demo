import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export interface Settings {
  store_name: string;
  store_address: string;
  store_phone: string;
  tax_ppn: string;
  currency_symbol: string;
  monthly_target: string;
  [key: string]: string;
}

export function useSettings() {
  const token = localStorage.getItem('token');
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data.data as Settings;
    },
    enabled: !!token
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const response = await api.post('/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast('Pengaturan berhasil diperbarui', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal memperbarui pengaturan', 'error');
    }
  });
}
