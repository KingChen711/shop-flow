'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api/products';

const priceRanges = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: undefined },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b pb-4">
      <button
        className="flex w-full items-center justify-between py-2 text-sm font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div className={cn('overflow-hidden transition-all', isOpen ? 'max-h-96 pt-2' : 'max-h-0')}>
        {children}
      </div>
    </div>
  );
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function ProductFilters({
  categories,
  selectedCategory,
  minPrice,
  maxPrice,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset to page 1 when changing filters
      params.delete('page');

      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newValue = checked ? categoryId : undefined;
    router.push(`${pathname}?${createQueryString({ category: newValue })}`);
  };

  const handlePriceChange = (min?: number, max?: number) => {
    router.push(
      `${pathname}?${createQueryString({
        minPrice: min?.toString(),
        maxPrice: max?.toString(),
      })}`
    );
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasFilters = selectedCategory || minPrice || maxPrice;

  // Check which price range is selected
  const selectedPriceRange = priceRanges.find(
    (range) =>
      String(range.min) === minPrice &&
      (range.max === undefined ? !maxPrice : String(range.max) === maxPrice)
  );

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-4 text-lg font-semibold">Filters</h2>

      {/* Categories */}
      <FilterSection title="Categories">
        <div className="space-y-2">
          {categories.length > 0 ? (
            categories.map((category) => (
              <label key={category.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-input"
                  checked={selectedCategory === category.id}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                />
                <span className="flex-1 text-sm">{category.name}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No categories available</p>
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price">
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.label} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="price"
                className="border-input"
                checked={selectedPriceRange === range}
                onChange={() => handlePriceChange(range.min, range.max)}
              />
              <span className="text-sm">{range.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          className="mt-4 w-full rounded-md border py-2 text-sm hover:bg-accent"
          onClick={clearAllFilters}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
