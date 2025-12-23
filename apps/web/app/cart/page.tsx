'use client';

import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Link href="/products">
            <Button className="mt-8">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>
      <p className="mt-2 text-muted-foreground">{items.length} items in your cart</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex gap-4 p-4 ${index !== items.length - 1 ? 'border-b' : ''}`}
              >
                {/* Product Image */}
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                </div>

                {/* Product Details */}
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center rounded-md border">
                      <button
                        className="px-3 py-1 hover:bg-accent disabled:opacity-50"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center text-sm">{item.quantity}</span>
                      <button
                        className="px-3 py-1 hover:bg-accent"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      className="text-sm text-destructive hover:underline"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            <Button variant="ghost" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {shipping > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Add {formatCurrency(50 - subtotal)} more for free shipping!
              </p>
            )}

            <Link href="/checkout">
              <Button className="mt-6 w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Secure checkout powered by Stripe
            </p>
          </div>

          {/* Promo Code */}
          <div className="mt-4 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Promo Code</h3>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
              <Button variant="outline">Apply</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
