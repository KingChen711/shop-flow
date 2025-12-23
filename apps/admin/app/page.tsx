import { Header } from '@/components/layout/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { TopProducts } from '@/components/dashboard/top-products';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" description="Overview of your store performance" />
      <div className="p-6">
        <StatsCards />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <TopProducts />
        </div>
        <div className="mt-6">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
