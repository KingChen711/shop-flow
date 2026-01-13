import { Suspense } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters';
import { ProductsHeader } from '@/components/products/products-header';
import { ProductsPagination } from '@/components/products/products-pagination';
import { getProducts, getCategories } from '@/lib/data/products';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  // Parse sort parameter (format: "field-order", e.g., "price-asc")
  const [sortBy, sortOrder] = params.sort?.split('-') || [];

  // Fetch products and categories in parallel
  const [productsData, categories] = await Promise.all([
    getProducts({
      page: params.page ? parseInt(params.page) : 1,
      limit: 12,
      categoryId: params.category,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      search: params.search,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
            <ProductFilters
              categories={categories}
              selectedCategory={params.category}
              minPrice={params.minPrice}
              maxPrice={params.maxPrice}
            />
          </Suspense>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <Suspense
            fallback={
              <div className="mb-6 flex items-center justify-between">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="h-10 w-40 animate-pulse rounded bg-muted" />
              </div>
            }
          >
            <ProductsHeader
              total={productsData.total}
              currentSort={params.sort}
              search={params.search}
            />
          </Suspense>

          {/* Products Grid */}
          {productsData.products.length > 0 ? (
            <ProductGrid products={productsData.products} columns={3} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or search term
              </p>
            </div>
          )}

          {/* Pagination */}
          {productsData.totalPages > 1 && (
            <Suspense
              fallback={
                <div className="mt-8 flex justify-center gap-2">
                  <div className="h-10 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-10 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-24 animate-pulse rounded bg-muted" />
                </div>
              }
            >
              <ProductsPagination
                currentPage={productsData.page}
                totalPages={productsData.totalPages}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
