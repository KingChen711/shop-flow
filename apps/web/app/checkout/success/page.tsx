import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>

        <h1 className="mt-6 text-3xl font-bold">Thank you for your order!</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your order has been placed successfully. We&apos;ll send you a confirmation email shortly.
        </p>

        <div className="mt-8 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Order Number</p>
          <p className="mt-1 text-xl font-bold">{orderNumber}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-6 text-left">
            <Package className="h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Shipping Updates</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ll receive shipping updates via email and SMS.
            </p>
          </div>
          <div className="rounded-lg border p-6 text-left">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Order Confirmation</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/account/orders">
            <Button variant="outline">View Order</Button>
          </Link>
          <Link href="/products">
            <Button>
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
