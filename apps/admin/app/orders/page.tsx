import { Header } from '@/components/layout/header';
import { OrdersTable } from '@/components/orders/orders-table';
import { OrdersFilters } from '@/components/orders/orders-filters';
import { OrdersStats } from '@/components/orders/orders-stats';

export default function OrdersPage() {
  return (
    <>
      <Header title="Orders" description="View and manage customer orders" />
      <div className="p-6">
        <OrdersStats />
        <div className="mt-6">
          <OrdersFilters />
        </div>
        <div className="mt-6">
          <OrdersTable />
        </div>
      </div>
    </>
  );
}
