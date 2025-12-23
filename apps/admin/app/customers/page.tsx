import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Mail, MoreHorizontal } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const customers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    orders: 12,
    totalSpent: 1245.99,
    status: 'active' as const,
    joinDate: '2023-06-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    orders: 8,
    totalSpent: 892.5,
    status: 'active' as const,
    joinDate: '2023-08-22',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    orders: 3,
    totalSpent: 234.0,
    status: 'inactive' as const,
    joinDate: '2023-11-10',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    orders: 25,
    totalSpent: 3456.75,
    status: 'active' as const,
    joinDate: '2023-02-28',
  },
  {
    id: '5',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    orders: 6,
    totalSpent: 567.99,
    status: 'active' as const,
    joinDate: '2023-09-05',
  },
];

export default function CustomersPage() {
  return (
    <>
      <Header title="Customers" description="Manage your customer base" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers..." className="w-64 pl-9" />
          </div>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send Newsletter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>A list of all registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(customer.totalSpent)}</TableCell>
                    <TableCell>
                      <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(customer.joinDate)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
