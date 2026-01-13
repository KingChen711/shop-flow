'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface ProductsHeaderProps {
  total: number;
  currentSort?: string;
  search?: string;
}

const sortOptions = [
  { label: 'Newest First', value: 'createdAt-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A-Z', value: 'name-asc' },
];

export function ProductsHeader({ total, currentSort, search }: ProductsHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset to page 1 when changing sort
      params.delete('page');
      return params.toString();
    },
    [searchParams]
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(`${pathname}?${createQueryString('sort', value)}`);
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{search ? `Search: "${search}"` : 'All Products'}</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'product' : 'products'} found
        </p>
      </div>
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={currentSort || ''}
        onChange={handleSortChange}
      >
        <option value="">Sort by: Relevance</option>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
