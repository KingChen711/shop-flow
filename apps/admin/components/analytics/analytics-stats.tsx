import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const stats = [
  {
    title: 'Total Sales',
    value: 125430.89,
    change: 12.5,
    icon: DollarSign,
    format: 'currency' as const,
  },
  {
    title: 'Average Order Value',
    value: 86.42,
    change: 3.2,
    icon: ShoppingBag,
    format: 'currency' as const,
  },
  {
    title: 'Conversion Rate',
    value: 3.24,
    change: 0.8,
    icon: TrendingUp,
    format: 'percent' as const,
  },
  {
    title: 'Active Customers',
    value: 4521,
    change: 8.1,
    icon: Users,
    format: 'number' as const,
  },
];

export function AnalyticsStats() {
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
              {stat.format === 'currency' && formatCurrency(stat.value)}
              {stat.format === 'percent' && `${stat.value}%`}
              {stat.format === 'number' && stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+{stat.change}%</span> from last period
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
