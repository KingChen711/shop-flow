import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';

const stats = [
  {
    title: 'Total Revenue',
    value: 45231.89,
    change: 20.1,
    trend: 'up' as const,
    icon: DollarSign,
    format: 'currency' as const,
  },
  {
    title: 'Orders',
    value: 2350,
    change: 15.2,
    trend: 'up' as const,
    icon: ShoppingCart,
    format: 'number' as const,
  },
  {
    title: 'Products',
    value: 1247,
    change: 5.4,
    trend: 'up' as const,
    icon: Package,
    format: 'number' as const,
  },
  {
    title: 'Customers',
    value: 12543,
    change: -2.3,
    trend: 'down' as const,
    icon: Users,
    format: 'number' as const,
  },
];

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.format === 'currency'
                ? formatCurrency(stat.value)
                : stat.value.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stat.trend === 'up' ? (
                <TrendingUp className="mr-1 h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
              )}
              <span className={cn(stat.trend === 'up' ? 'text-success' : 'text-destructive')}>
                {stat.change > 0 ? '+' : ''}
                {stat.change}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
