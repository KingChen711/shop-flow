'use client';

import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
  };

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
            📦
          </div>
          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
            {!product.inStock && <Badge variant="secondary">Out of Stock</Badge>}
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
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 font-medium line-clamp-2">{product.name}</h3>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(product.rating))}
              {'☆'.repeat(5 - Math.floor(product.rating))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>

          {/* Price */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <Button className="mt-3 w-full" disabled={!product.inStock} onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  );
}
