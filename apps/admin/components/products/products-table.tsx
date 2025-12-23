'use client';

import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type ProductStatus = 'active' | 'draft' | 'archived';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones Pro',
    sku: 'WHP-001',
    category: 'Electronics',
    price: 199.99,
    stock: 145,
    status: 'active',
    image: '/products/headphones.jpg',
  },
  {
    id: '2',
    name: 'Ergonomic Office Chair',
    sku: 'EOC-002',
    category: 'Furniture',
    price: 349.99,
    stock: 32,
    status: 'active',
    image: '/products/chair.jpg',
  },
  {
    id: '3',
    name: 'Smart Watch Series 5',
    sku: 'SW5-003',
    category: 'Electronics',
    price: 299.99,
    stock: 0,
    status: 'archived',
    image: '/products/watch.jpg',
  },
  {
    id: '4',
    name: 'Premium Yoga Mat',
    sku: 'PYM-004',
    category: 'Sports',
    price: 49.99,
    stock: 234,
    status: 'active',
    image: '/products/yoga-mat.jpg',
  },
  {
    id: '5',
    name: 'Organic Coffee Beans',
    sku: 'OCB-005',
    category: 'Food & Drinks',
    price: 24.99,
    stock: 567,
    status: 'active',
    image: '/products/coffee.jpg',
  },
  {
    id: '6',
    name: 'Bluetooth Speaker',
    sku: 'BTS-006',
    category: 'Electronics',
    price: 79.99,
    stock: 12,
    status: 'draft',
    image: '/products/speaker.jpg',
  },
  {
    id: '7',
    name: 'Running Shoes Pro',
    sku: 'RSP-007',
    category: 'Sports',
    price: 129.99,
    stock: 89,
    status: 'active',
    image: '/products/shoes.jpg',
  },
  {
    id: '8',
    name: 'Leather Wallet',
    sku: 'LW-008',
    category: 'Accessories',
    price: 59.99,
    stock: 156,
    status: 'active',
    image: '/products/wallet.jpg',
  },
];

const statusVariants: Record<ProductStatus, 'success' | 'secondary' | 'warning'> = {
  active: 'success',
  draft: 'secondary',
  archived: 'warning',
};

export function ProductsTable() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" className="rounded border-input" />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <input type="checkbox" className="rounded border-input" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-medium">
                      IMG
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      product.stock === 0 && 'text-destructive',
                      product.stock > 0 && product.stock <= 20 && 'text-warning'
                    )}
                  >
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[product.status]}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {openMenuId === product.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-8 z-20 w-36 rounded-md border bg-popover p-1 shadow-md">
                          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {products.length} of {products.length} products
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
