import { Header } from '@/components/layout/header';
import { ProductsTable } from '@/components/products/products-table';
import { ProductsFilters } from '@/components/products/products-filters';

export default function ProductsPage() {
  return (
    <>
      <Header title="Products" description="Manage your product catalog" />
      <div className="p-6">
        <ProductsFilters />
        <div className="mt-6">
          <ProductsTable />
        </div>
      </div>
    </>
  );
}
