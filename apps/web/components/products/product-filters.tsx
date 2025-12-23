'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Electronics', count: 45 },
  { name: 'Clothing', count: 32 },
  { name: 'Furniture', count: 18 },
  { name: 'Sports', count: 24 },
  { name: 'Food & Drinks', count: 15 },
  { name: 'Accessories', count: 28 },
];

const priceRanges = [
  { label: 'Under $25', value: '0-25' },
  { label: '$25 - $50', value: '25-50' },
  { label: '$50 - $100', value: '50-100' },
  { label: '$100 - $200', value: '100-200' },
  { label: 'Over $200', value: '200-' },
];

const ratings = [5, 4, 3, 2, 1];

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

export function ProductFilters() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-4 text-lg font-semibold">Filters</h2>

      {/* Categories */}
      <FilterSection title="Categories">
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.name} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="rounded border-input" />
              <span className="flex-1 text-sm">{category.name}</span>
              <span className="text-xs text-muted-foreground">({category.count})</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price">
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.value} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="price" className="border-input" />
              <span className="text-sm">{range.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating">
        <div className="space-y-2">
          {ratings.map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="rounded border-input" />
              <span className="text-sm text-yellow-400">
                {'★'.repeat(rating)}
                {'☆'.repeat(5 - rating)}
              </span>
              <span className="text-sm">& Up</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="rounded border-input" defaultChecked />
            <span className="text-sm">In Stock</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="rounded border-input" />
            <span className="text-sm">Out of Stock</span>
          </label>
        </div>
      </FilterSection>

      {/* Clear Filters */}
      <button className="mt-4 w-full rounded-md border py-2 text-sm hover:bg-accent">
        Clear All Filters
      </button>
    </div>
  );
}
