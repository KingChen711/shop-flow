import { apiClient } from './client';

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  category: string;
  sales: number;
  revenue: number;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgOrderValue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  totalCustomers: number;
  customersChange: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export const analyticsApi = {
  getDashboardStats: () => apiClient.get<DashboardStats>('/api/analytics/dashboard'),

  getRevenueData: (filters?: AnalyticsFilters) =>
    apiClient.get<RevenueData[]>(
      '/api/analytics/revenue',
      filters as Record<string, string | number | undefined>
    ),

  getTopProducts: (limit?: number) =>
    apiClient.get<TopProduct[]>('/api/analytics/top-products', { limit }),

  getCustomerStats: () => apiClient.get<CustomerStats>('/api/analytics/customers'),
};
