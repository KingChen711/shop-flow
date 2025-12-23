import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const orders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    email: 'john@example.com',
    total: 245.99,
    status: 'delivered' as OrderStatus,
    date: '2024-01-15T10:30:00',
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    email: 'jane@example.com',
    total: 189.5,
    status: 'shipped' as OrderStatus,
    date: '2024-01-15T09:15:00',
  },
  {
    id: 'ORD-003',
    customer: 'Bob Wilson',
    email: 'bob@example.com',
    total: 567.0,
    status: 'processing' as OrderStatus,
    date: '2024-01-15T08:45:00',
  },
  {
    id: 'ORD-004',
    customer: 'Alice Brown',
    email: 'alice@example.com',
    total: 123.75,
    status: 'pending' as OrderStatus,
    date: '2024-01-15T07:30:00',
  },
  {
    id: 'ORD-005',
    customer: 'Charlie Davis',
    email: 'charlie@example.com',
    total: 89.99,
    status: 'cancelled' as OrderStatus,
    date: '2024-01-14T16:20:00',
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

export function RecentOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest orders from your customers</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-sm text-muted-foreground">{order.email}</div>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[order.status]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(order.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
