import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, ShoppingCart, Users, Settings, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const notifications = [
  {
    id: '1',
    title: 'New Order Received',
    description: 'Order #ORD-2024-156 has been placed by John Doe for $245.99',
    type: 'order' as const,
    time: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    description: 'Wireless Headphones Pro is running low on stock (12 units remaining)',
    type: 'inventory' as const,
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    title: 'New Customer Registration',
    description: 'Alice Brown has created a new account',
    type: 'customer' as const,
    time: '2 hours ago',
    read: true,
  },
  {
    id: '4',
    title: 'Order Shipped',
    description: 'Order #ORD-2024-142 has been shipped successfully',
    type: 'order' as const,
    time: '3 hours ago',
    read: true,
  },
  {
    id: '5',
    title: 'Payment Received',
    description: 'Payment of $567.00 received for Order #ORD-2024-155',
    type: 'payment' as const,
    time: '5 hours ago',
    read: true,
  },
];

const typeIcons = {
  order: ShoppingCart,
  inventory: Package,
  customer: Users,
  payment: Bell,
  system: Settings,
};

const typeColors = {
  order: 'bg-info/15 text-info',
  inventory: 'bg-warning/15 text-warning',
  customer: 'bg-success/15 text-success',
  payment: 'bg-primary/15 text-primary',
  system: 'bg-muted text-muted-foreground',
};

export default function NotificationsPage() {
  return (
    <>
      <Header title="Notifications" description="Stay updated with your store activities" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">2 unread</Badge>
          </div>
          <Button variant="outline" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>Recent activity and alerts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 p-4 transition-colors hover:bg-muted/50',
                      !notification.read && 'bg-muted/30'
                    )}
                  >
                    <div className={cn('rounded-full p-2', typeColors[notification.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
