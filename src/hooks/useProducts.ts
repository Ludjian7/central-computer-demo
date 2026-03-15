import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const useProducts = (filters: any = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await api.get('/products', { params: filters });
      return response.data.data;
    },
  });
};

export const useMutateProduct = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      if (data.id && data.id !== 'new') { // basic check, real id is numerical or specific string format, assuming update if true id
        // Needs proper id check based on backend logic. Assuming the 'add' gives no ID or ID we can ignore
        // Actually, backend expects no ID on create, ID on update.
        // I will let the caller handle whether they're calling this for create or update by inspecting the object.
        if (data.isUpdate) {
            const { isUpdate, id, ...payload } = data;
            const response = await api.put(`/products/${id}`, payload);
            return response.data;
        } else {
            const response = await api.post('/products', data);
            return response.data;
        }
      } else {
        const response = await api.post('/products', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast('Produk berhasil disimpan!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal menyimpan produk', 'error');
    }
  });
};

export const useRestockProduct = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({ id, quantity, supplier_id, notes }: { id: string | number, quantity: number, supplier_id?: number, notes?: string }) => {
      const response = await api.post(`/products/${id}/restock`, { quantity, supplier_id, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeactivateProduct = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await api.patch(`/products/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
export const useLowStock = () => {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      const response = await api.get('/products/low-stock');
      return response.data.data;
    },
  });
};
