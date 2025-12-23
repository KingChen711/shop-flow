import { Header } from '@/components/layout/header';
import { AnalyticsStats } from '@/components/analytics/analytics-stats';
import { SalesChart } from '@/components/analytics/sales-chart';
import { OrdersChart } from '@/components/analytics/orders-chart';
import { TopCategories } from '@/components/analytics/top-categories';

export default function AnalyticsPage() {
  return (
    <>
      <Header title="Analytics" description="Business performance insights" />
      <div className="p-6">
        <AnalyticsStats />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SalesChart />
          <OrdersChart />
        </div>
        <div className="mt-6">
          <TopCategories />
        </div>
      </div>
    </>
  );
}
