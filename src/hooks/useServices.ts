import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const useServices = (filters: any = {}) => {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const response = await api.get('/services', { params: filters });
      return response.data.data;
    },
  });
};

export const useUpdateServiceStatus = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string | number, status: string }) => {
      const response = await api.patch(`/services/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addToast('Status servis diperbarui!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal mengubah status', 'error');
    }
  });
};

export const useAssignTechnician = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({ id, technician_id }: { id: string | number, technician_id: number }) => {
      const response = await api.patch(`/services/${id}/technician`, { technician_id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      addToast('Teknisi berhasil ditugaskan!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal menugaskan teknisi', 'error');
    }
  });
};

export const useTechnicians = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
       const response = await api.get('/auth/users');
       // Filter non-owner if needed, or just return all users for the dropdown
       return response.data.data;
    }
  });
};
