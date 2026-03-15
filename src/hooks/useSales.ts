import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const useSales = (filters: any = {}) => {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const response = await api.get('/sales', { params: filters });
      return response.data.data;
    },
  });
};

export const useSaleDetail = (id: string | number | null) => {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async () => {
      const response = await api.get(`/sales/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/sales', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Sales affect stock
      queryClient.invalidateQueries({ queryKey: ['reports'] }); // Sales affect reports
      addToast('Transaksi berhasil!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Transaksi gagal', 'error');
    }
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string | number, status: string }) => {
      const response = await api.patch(`/sales/${id}/status`, { payment_status: status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      addToast('Status pembayaran diperbarui!', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Gagal mengubah status bar', 'error');
    }
  });
};

export const useExportSalesCSV = () => {
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (filters: any = {}) => {
      const response = await api.get('/sales/export', {
        params: filters,
        responseType: 'blob', // Important for file downloads
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Berhasil mengekspor file CSV!', 'success');
    },
    onError: () => {
      addToast('Gagal mengekspor CSV dari server', 'error');
    }
  });
};
