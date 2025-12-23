'use client';

import { MoreHorizontal, Eye, Printer, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useState } from 'react';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  items: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  date: string;
}

const orders: Order[] = [
  {
    id: 'ORD-2024-001',
    customer: { name: 'John Doe', email: 'john@example.com' },
    items: 3,
    total: 245.99,
    status: 'delivered',
    paymentMethod: 'Credit Card',
    date: '2024-01-15T10:30:00',
  },
  {
    id: 'ORD-2024-002',
    customer: { name: 'Jane Smith', email: 'jane@example.com' },
    items: 2,
    total: 189.5,
    status: 'shipped',
    paymentMethod: 'PayPal',
    date: '2024-01-15T09:15:00',
  },
  {
    id: 'ORD-2024-003',
    customer: { name: 'Bob Wilson', email: 'bob@example.com' },
    items: 5,
    total: 567.0,
    status: 'processing',
    paymentMethod: 'Credit Card',
    date: '2024-01-15T08:45:00',
  },
  {
    id: 'ORD-2024-004',
    customer: { name: 'Alice Brown', email: 'alice@example.com' },
    items: 1,
    total: 123.75,
    status: 'pending',
    paymentMethod: 'Debit Card',
    date: '2024-01-15T07:30:00',
  },
  {
    id: 'ORD-2024-005',
    customer: { name: 'Charlie Davis', email: 'charlie@example.com' },
    items: 2,
    total: 89.99,
    status: 'cancelled',
    paymentMethod: 'Credit Card',
    date: '2024-01-14T16:20:00',
  },
  {
    id: 'ORD-2024-006',
    customer: { name: 'Eva Martinez', email: 'eva@example.com' },
    items: 4,
    total: 312.5,
    status: 'shipped',
    paymentMethod: 'PayPal',
    date: '2024-01-14T14:10:00',
  },
  {
    id: 'ORD-2024-007',
    customer: { name: 'Frank Johnson', email: 'frank@example.com' },
    items: 1,
    total: 79.99,
    status: 'processing',
    paymentMethod: 'Credit Card',
    date: '2024-01-14T12:00:00',
  },
  {
    id: 'ORD-2024-008',
    customer: { name: 'Grace Lee', email: 'grace@example.com' },
    items: 6,
    total: 459.94,
    status: 'delivered',
    paymentMethod: 'Bank Transfer',
    date: '2024-01-14T10:30:00',
  },
];

const statusVariants: Record<
  OrderStatus,
  'success' | 'warning' | 'info' | 'secondary' | 'destructive'
> = {
  pending: 'secondary',
  processing: 'info',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'destructive',
};

export function OrdersTable() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" className="rounded border-input" />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <input type="checkbox" className="rounded border-input" />
                </TableCell>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer.name}</div>
                    <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                  </div>
                </TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                <TableCell className="text-muted-foreground">{order.paymentMethod}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[order.status]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(order.date)}
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {openMenuId === order.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-md border bg-popover p-1 shadow-md">
                          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                            <Printer className="h-4 w-4" />
                            Print Invoice
                          </button>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent">
                              <XCircle className="h-4 w-4" />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {orders.length} of {orders.length} orders
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
