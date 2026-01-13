'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import type { Product } from '@/lib/api/products';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'attributes'>('description');
  const addItem = useCartStore((state) => state.addItem);

  const images = product.imageUrls?.length ? product.imageUrls : [];
  const inStock = product.isActive !== false;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: images[0],
    });
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.categoryName && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/products?category=${product.categoryId}`}
              className="hover:text-foreground"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage] || ''}
                alt={product.name}
                width={600}
                height={600}
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl">📦</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border bg-muted ${
                    selectedImage === index ? 'ring-2 ring-primary' : 'hover:border-primary'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={150}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2">
            {product.categoryName && <Badge variant="secondary">{product.categoryName}</Badge>}
          </div>

          <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>

          {/* Price */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
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
            <Button className="flex-1" size="lg" onClick={handleAddToCart} disabled={!inStock}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Stock Status */}
          <p className={`mt-4 text-sm ${inStock ? 'text-green-600' : 'text-destructive'}`}>
            {inStock ? '✓ In Stock - Ready to ship' : '✕ Out of Stock'}
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
            {(['description', 'attributes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'description' ? 'Description' : 'Specifications'}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {activeTab === 'attributes' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {product.attributes && product.attributes.length > 0 ? (
                product.attributes.map((attr, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <span className="font-medium">{attr.key}</span>
                    <span className="text-muted-foreground">{attr.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No specifications available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
