import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const orders: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15',
    total: 245.99,
    status: 'delivered',
    items: [
      { name: 'Wireless Bluetooth Headphones', quantity: 1, price: 149.99 },
      { name: 'Premium Yoga Mat', quantity: 2, price: 49.99 },
    ],
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-10',
    total: 349.99,
    status: 'shipped',
    items: [{ name: 'Ergonomic Office Chair', quantity: 1, price: 349.99 }],
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-05',
    total: 89.99,
    status: 'processing',
    items: [{ name: 'Portable Bluetooth Speaker', quantity: 1, price: 89.99 }],
  },
  {
    id: 'ORD-2023-045',
    date: '2023-12-20',
    total: 567.0,
    status: 'delivered',
    items: [
      { name: 'Smart Watch Series 5', quantity: 1, price: 299.99 },
      { name: 'Running Shoes Pro', quantity: 2, price: 119.99 },
    ],
  },
];

const statusVariants: Record<OrderStatus, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  processing: 'warning',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'destructive',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">
          Account
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Orders</span>
      </nav>

      <h1 className="text-2xl font-bold">My Orders</h1>
      <p className="mt-2 text-muted-foreground">View and track your order history</p>

      {/* Orders List */}
      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border bg-card">
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                <p className="font-semibold">{formatCurrency(order.total)}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted">
                      <div className="flex h-full w-full items-center justify-center text-lg">
                        📦
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {order.status === 'shipped' && (
                  <Button variant="outline" size="sm">
                    Track Package
                  </Button>
                )}
                {order.status === 'delivered' && (
                  <Button variant="outline" size="sm">
                    Write Review
                  </Button>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Button variant="outline" size="sm" className="text-destructive">
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="mt-16 text-center">
          <Package className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
          <p className="mt-2 text-muted-foreground">
            When you place an order, it will appear here.
          </p>
          <Link href="/products">
            <Button className="mt-8">Start Shopping</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
