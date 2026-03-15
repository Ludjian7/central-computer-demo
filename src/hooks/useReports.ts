import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface PLSummary {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
}

export interface PLCategory {
  category: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number;
}

export interface PLPeriod {
  period: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  transactions: number;
}

export interface PLData {
  summary: PLSummary;
  by_category: PLCategory[];
  by_period: PLPeriod[];
}

export function useProfitLoss(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'profit-loss', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/profit-loss', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data.data as PLData;
    },
    enabled: !!startDate && !!endDate
  });
}

export function useReportsSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'summary', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/summary', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data.data;
    }
  });
}

export function useReportsSalesTrend(params: { start_date?: string, end_date?: string, period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
  return useQuery({
    queryKey: ['reports', 'sales-trend', params],
    queryFn: async () => {
      const response = await api.get('/reports/sales-trend', { params });
      return response.data.data;
    }
  });
}

export function useTopProducts(params: { start_date?: string, end_date?: string, limit?: number }) {
  return useQuery({
    queryKey: ['reports', 'top-products', params],
    queryFn: async () => {
      const response = await api.get('/reports/top-products', { params });
      return response.data.data;
    }
  });
}

export function useTechnicianPerformance(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'technician-performance', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/technician-performance', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data.data;
    }
  });
}
