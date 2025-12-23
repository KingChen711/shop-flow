'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, CreditCard, Truck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency } from '@/lib/utils';

type Step = 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: '',
  });

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    clearCart();
    router.push('/checkout/success');
  };

  const steps = [
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: Check },
  ];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items to checkout.</p>
          <Link href="/products">
            <Button className="mt-8">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/cart" className="hover:text-foreground">
          Cart
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Checkout</span>
      </nav>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : steps.findIndex((s) => s.id === currentStep) > index
                      ? 'bg-success/20 text-success'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <step.icon className="h-4 w-4" />
                {step.label}
              </div>
              {index < steps.length - 1 && <div className="mx-2 h-px w-12 bg-border sm:w-24" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {/* Shipping Step */}
          {currentStep === 'shipping' && (
            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Shipping Information</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    className="mt-1"
                    value={shippingInfo.firstName}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    className="mt-1"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    className="mt-1"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    className="mt-1"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    className="mt-1"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    className="mt-1"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input
                    className="mt-1"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ZIP Code</label>
                  <Input
                    className="mt-1"
                    value={shippingInfo.zip}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input className="mt-1" value={shippingInfo.country} disabled />
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => setCurrentStep('payment')}>
                Continue to Payment
              </Button>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Payment Information</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium">Name on Card</label>
                  <Input
                    className="mt-1"
                    value={paymentInfo.nameOnCard}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, nameOnCard: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Card Number</label>
                  <Input
                    className="mt-1"
                    placeholder="1234 5678 9012 3456"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Expiry Date</label>
                    <Input
                      className="mt-1"
                      placeholder="MM/YY"
                      value={paymentInfo.expiry}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CVC</label>
                    <Input
                      className="mt-1"
                      placeholder="123"
                      value={paymentInfo.cvc}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cvc: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('shipping')}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setCurrentStep('review')}>
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <h2 className="text-lg font-semibold">Shipping Address</h2>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    {shippingInfo.firstName} {shippingInfo.lastName}
                  </p>
                  <p>{shippingInfo.address}</p>
                  <p>
                    {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}
                  </p>
                  <p>{shippingInfo.country}</p>
                  <p className="mt-2">{shippingInfo.email}</p>
                  <p>{shippingInfo.phone}</p>
                </div>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0"
                  onClick={() => setCurrentStep('shipping')}
                >
                  Edit
                </Button>
              </div>

              <div className="rounded-lg border p-6">
                <h2 className="text-lg font-semibold">Payment Method</h2>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Card ending in ****{paymentInfo.cardNumber.slice(-4) || '0000'}</p>
                  <p>Expires {paymentInfo.expiry || 'MM/YY'}</p>
                </div>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0"
                  onClick={() => setCurrentStep('payment')}
                >
                  Edit
                </Button>
              </div>

              <div className="rounded-lg border p-6">
                <h2 className="text-lg font-semibold">Order Items</h2>
                <div className="mt-4 divide-y">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted">
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          📦
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Place Order • ${formatCurrency(total)}`}
              </Button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
