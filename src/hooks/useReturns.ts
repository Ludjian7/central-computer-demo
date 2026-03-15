import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const useReturns = (filters: any = {}) => {
  return useQuery({
    queryKey: ['returns', filters],
    queryFn: async () => {
      const response = await api.get('/returns', { params: filters });
      return response.data.data;
    },
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/returns', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] }); // Because we return from a sale
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock is restored
      addToast('Retur berhasil diproses!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal memproses retur', 'error');
    }
  });
};
