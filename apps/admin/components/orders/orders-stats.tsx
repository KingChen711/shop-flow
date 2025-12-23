import { Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { label: 'Pending', value: 23, icon: Clock, color: 'text-muted-foreground' },
  { label: 'Processing', value: 45, icon: CheckCircle, color: 'text-info' },
  { label: 'Shipped', value: 128, icon: Truck, color: 'text-warning' },
  { label: 'Cancelled', value: 8, icon: XCircle, color: 'text-destructive' },
];

export function OrdersStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-full bg-muted p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
