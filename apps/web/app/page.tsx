import Link from 'next/link';
import { ArrowRight, Truck, Shield, RefreshCcw, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/product-grid';
import type { Product } from '@/components/products/product-card';

const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium sound quality with noise cancellation',
    price: 149.99,
    originalPrice: 199.99,
    image: '/products/headphones.jpg',
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
  },
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
    id: '3',
    name: 'Ergonomic Office Chair',
    description: 'Comfortable seating for long work hours',
    price: 349.99,
    originalPrice: 449.99,
    image: '/products/chair.jpg',
    category: 'Furniture',
    rating: 4.3,
    reviewCount: 89,
    inStock: true,
  },
  {
    id: '4',
    name: 'Premium Yoga Mat',
    description: 'Non-slip surface for your workout',
    price: 49.99,
    image: '/products/yoga-mat.jpg',
    category: 'Sports',
    rating: 4.6,
    reviewCount: 312,
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
    id: '6',
    name: 'Organic Coffee Beans',
    description: 'Premium roasted beans from Colombia',
    price: 24.99,
    image: '/products/coffee.jpg',
    category: 'Food & Drinks',
    rating: 4.9,
    reviewCount: 445,
    inStock: true,
  },
  {
    id: '7',
    name: 'Leather Messenger Bag',
    description: 'Stylish and functional for daily use',
    price: 129.99,
    image: '/products/bag.jpg',
    category: 'Accessories',
    rating: 4.2,
    reviewCount: 67,
    inStock: false,
  },
  {
    id: '8',
    name: 'Running Shoes Pro',
    description: 'Lightweight and responsive cushioning',
    price: 119.99,
    originalPrice: 149.99,
    image: '/products/shoes.jpg',
    category: 'Sports',
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
  },
];

const categories = [
  { name: 'Electronics', href: '/products?category=electronics', emoji: '📱' },
  { name: 'Clothing', href: '/products?category=clothing', emoji: '👕' },
  { name: 'Furniture', href: '/products?category=furniture', emoji: '🪑' },
  { name: 'Sports', href: '/products?category=sports', emoji: '⚽' },
  { name: 'Food & Drinks', href: '/products?category=food', emoji: '☕' },
  { name: 'Accessories', href: '/products?category=accessories', emoji: '👜' },
];

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $50',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure checkout',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated support team',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Discover Amazing
              <span className="block text-primary">Products</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Shop the latest trends with unbeatable prices. Quality products, fast shipping, and
              exceptional customer service.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link href="/categories" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
            >
              <span className="text-4xl">{category.emoji}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link href="/products" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featuredProducts} />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Subscribe to our newsletter</h2>
          <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
            Get the latest updates on new products and special offers delivered right to your inbox.
          </p>
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-md border-0 bg-white/10 px-4 py-3 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <Button variant="secondary" size="lg">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
