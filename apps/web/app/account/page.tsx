import Link from 'next/link';
import { User, Package, Heart, Settings, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    icon: Package,
    title: 'My Orders',
    description: 'View and track your orders',
    href: '/account/orders',
  },
  {
    icon: Heart,
    title: 'Wishlist',
    description: 'Products you saved for later',
    href: '/account/wishlist',
  },
  {
    icon: MapPin,
    title: 'Addresses',
    description: 'Manage your shipping addresses',
    href: '/account/addresses',
  },
  {
    icon: CreditCard,
    title: 'Payment Methods',
    description: 'Manage your payment options',
    href: '/account/payments',
  },
  {
    icon: Settings,
    title: 'Account Settings',
    description: 'Update your profile and preferences',
    href: '/account/settings',
  },
];

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">John Doe</h1>
            <p className="text-muted-foreground">john.doe@example.com</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Wishlist Items</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold">$1,234</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mt-8 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.title} href={item.href}>
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Sign Out */}
      <div className="mt-8">
        <Button variant="outline" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
