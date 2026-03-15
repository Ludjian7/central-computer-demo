import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useSuppliers = (filters: any = {}) => {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: async () => {
      const response = await api.get('/suppliers', { params: filters });
      return response.data.data;
    },
  });
};

export const useMutateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      if (data.isUpdate) {
        const { isUpdate, id, ...payload } = data;
        const response = await api.put(`/suppliers/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post('/suppliers', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useDeactivateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await api.patch(`/suppliers/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};
