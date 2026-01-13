'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import type { Product as ApiProduct } from '@/lib/api/products';

// Display product type (extends API product with optional display fields)
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  imageUrls?: string[];
  category?: string;
  categoryName?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isActive?: boolean;
}

interface ProductCardProps {
  product: Product | ApiProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Normalize product data (handle both API and display formats)
  const normalizedProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: 'originalPrice' in product ? product.originalPrice : undefined,
    image:
      'image' in product
        ? product.image
        : ('imageUrls' in product && product.imageUrls?.[0]) || undefined,
    category:
      'category' in product
        ? product.category
        : 'categoryName' in product
          ? product.categoryName
          : undefined,
    rating: 'rating' in product ? product.rating : undefined,
    reviewCount: 'reviewCount' in product ? product.reviewCount : undefined,
    inStock:
      'inStock' in product ? product.inStock : 'isActive' in product ? product.isActive : true,
  };

  const discount = normalizedProduct.originalPrice
    ? Math.round(
        ((normalizedProduct.originalPrice - normalizedProduct.price) /
          normalizedProduct.originalPrice) *
          100
      )
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: normalizedProduct.id,
      name: normalizedProduct.name,
      price: normalizedProduct.price,
      quantity: 1,
      image: normalizedProduct.image,
    });
  };

  return (
    <Link href={`/products/${normalizedProduct.id}`} className="group">
      <div className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {normalizedProduct.image ? (
            <Image
              src={normalizedProduct.image}
              alt={normalizedProduct.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
              📦
            </div>
          )}
          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
            {!normalizedProduct.inStock && <Badge variant="secondary">Out of Stock</Badge>}
          </div>
          {/* Wishlist button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 bg-background/80 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {normalizedProduct.category && (
            <p className="text-xs text-muted-foreground">{normalizedProduct.category}</p>
          )}
          <h3 className="mt-1 font-medium line-clamp-2">{normalizedProduct.name}</h3>

          {/* Rating */}
          {normalizedProduct.rating !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <div className="flex text-yellow-400">
                {'★'.repeat(Math.floor(normalizedProduct.rating))}
                {'☆'.repeat(5 - Math.floor(normalizedProduct.rating))}
              </div>
              {normalizedProduct.reviewCount !== undefined && (
                <span className="text-xs text-muted-foreground">
                  ({normalizedProduct.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold">{formatCurrency(normalizedProduct.price)}</span>
            {normalizedProduct.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(normalizedProduct.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <Button
            className="mt-3 w-full"
            disabled={!normalizedProduct.inStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  );
}
