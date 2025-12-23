'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Truck,
  Shield,
  RefreshCcw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { ProductGrid } from '@/components/products/product-grid';
import type { Product } from '@/components/products/product-card';

// Mock product data
const getProduct = (
  id: string
): Product & { longDescription: string; specifications: Record<string, string> } => ({
  id,
  name: 'Wireless Bluetooth Headphones Pro',
  description: 'Premium sound quality with active noise cancellation',
  longDescription:
    'Experience exceptional audio quality with our Wireless Bluetooth Headphones Pro. Featuring advanced active noise cancellation technology, these headphones deliver immersive sound in any environment. The premium drivers produce rich bass, clear mids, and crisp highs. With up to 30 hours of battery life and quick charge capability, you can enjoy your music all day long. The comfortable over-ear design with memory foam cushions ensures a perfect fit for extended listening sessions.',
  price: 149.99,
  originalPrice: 199.99,
  image: '/products/headphones.jpg',
  category: 'Electronics',
  rating: 4.5,
  reviewCount: 128,
  inStock: true,
  specifications: {
    'Driver Size': '40mm',
    'Frequency Response': '20Hz - 20kHz',
    'Battery Life': 'Up to 30 hours',
    Connectivity: 'Bluetooth 5.2',
    'Noise Cancellation': 'Active',
    Weight: '250g',
  },
});

const relatedProducts: Product[] = [
  {
    id: '2',
    name: 'Smart Watch Series 5',
    description: 'Track your fitness and stay connected',
    price: 299.99,
    image: '/products/watch.jpg',
    category: 'Electronics',
    rating: 4.8,
    reviewCount: 256,
    inStock: true,
  },
  {
    id: '5',
    name: 'Portable Bluetooth Speaker',
    description: 'Powerful sound in a compact design',
    price: 79.99,
    originalPrice: 99.99,
    image: '/products/speaker.jpg',
    category: 'Electronics',
    rating: 4.4,
    reviewCount: 178,
    inStock: true,
  },
  {
    id: '9',
    name: 'Mechanical Keyboard RGB',
    description: 'Tactile switches with customizable lighting',
    price: 129.99,
    image: '/products/keyboard.jpg',
    category: 'Electronics',
    rating: 4.6,
    reviewCount: 156,
    inStock: true,
  },
  {
    id: '11',
    name: 'Wireless Gaming Mouse',
    description: 'High precision sensor with low latency',
    price: 89.99,
    image: '/products/mouse.jpg',
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 203,
    inStock: true,
  },
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProduct(id);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>(
    'description'
  );
  const addItem = useCartStore((state) => state.addItem);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/products?category=${product.category.toLowerCase()}`}
          className="hover:text-foreground"
        >
          {product.category}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            <div className="flex h-full w-full items-center justify-center text-8xl">📦</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted hover:border-primary"
              >
                <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
          </div>

          <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(product.rating))}
              {'☆'.repeat(5 - Math.floor(product.rating))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <p className="mt-6 text-muted-foreground">{product.description}</p>

          {/* Quantity & Add to Cart */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center rounded-md border">
              <button
                className="px-4 py-3 hover:bg-accent disabled:opacity-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-16 text-center font-medium">{quantity}</span>
              <button
                className="px-4 py-3 hover:bg-accent"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Stock Status */}
          <p className={`mt-4 text-sm ${product.inStock ? 'text-success' : 'text-destructive'}`}>
            {product.inStock ? '✓ In Stock - Ready to ship' : '✕ Out of Stock'}
          </p>

          {/* Features */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Truck className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Shield className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">2 Year Warranty</p>
                <p className="text-xs text-muted-foreground">Full coverage</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <RefreshCcw className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Easy Returns</p>
                <p className="text-xs text-muted-foreground">30 day policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="border-b">
          <div className="flex gap-8">
            {(['description', 'specifications', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-muted-foreground">{product.longDescription}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center text-muted-foreground">
              <p>No reviews yet. Be the first to review this product!</p>
              <Button variant="outline" className="mt-4">
                Write a Review
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-bold">Related Products</h2>
        <ProductGrid products={relatedProducts} />
      </section>
    </div>
  );
}
