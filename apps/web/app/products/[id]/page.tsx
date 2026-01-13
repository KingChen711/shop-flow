import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/data/products';
import { ProductDetail } from '@/components/products/product-detail';
import { ProductGrid } from '@/components/products/product-grid';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// Allow dynamic params (products not pre-generated at build time)
export const dynamicParams = true;

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// Optional: Pre-generate popular products at build time
// Return empty array for fully on-demand generation
export async function generateStaticParams() {
  // For large catalogs, generate on-demand
  // For small catalogs, you could fetch and return all product IDs:
  // const { products } = await getProducts({ limit: 100 });
  // return products.map((p) => ({ id: p.id }));
  return [];
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  // Fetch product data
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // Fetch related products (same category, excluding current product)
  const relatedData = await getProducts({
    categoryId: product.categoryId,
    limit: 4,
  });

  const relatedProducts = relatedData.products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Product Details */}
      <ProductDetail product={product} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-bold">Related Products</h2>
        <ProductGrid products={relatedProducts} />
      </section>
      )}
    </div>
  );
}
