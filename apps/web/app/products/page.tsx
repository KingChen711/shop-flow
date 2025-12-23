import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters';
import type { Product } from '@/components/products/product-card';

const allProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium sound quality with active noise cancellation',
    price: 149.99,
    originalPrice: 199.99,
    image: '/products/headphones.jpg',
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    description: 'Track your fitness and stay connected',
    price: 299.99,
    image: '/products/watch.jpg',
    category: 'Electronics',
    rating: 4.8,
    reviewCount: 256,
    inStock: true,
  },
  {
    id: '3',
    name: 'Ergonomic Office Chair',
    description: 'Comfortable seating for long work hours',
    price: 349.99,
    originalPrice: 449.99,
    image: '/products/chair.jpg',
    category: 'Furniture',
    rating: 4.3,
    reviewCount: 89,
    inStock: true,
  },
  {
    id: '4',
    name: 'Premium Yoga Mat',
    description: 'Non-slip surface for your workout',
    price: 49.99,
    image: '/products/yoga-mat.jpg',
    category: 'Sports',
    rating: 4.6,
    reviewCount: 312,
    inStock: true,
  },
  {
    id: '5',
    name: 'Portable Bluetooth Speaker',
    description: 'Powerful sound in a compact design',
    price: 79.99,
    originalPrice: 99.99,
    image: '/products/speaker.jpg',
    category: 'Electronics',
    rating: 4.4,
    reviewCount: 178,
    inStock: true,
  },
  {
    id: '6',
    name: 'Organic Coffee Beans',
    description: 'Premium roasted beans from Colombia',
    price: 24.99,
    image: '/products/coffee.jpg',
    category: 'Food & Drinks',
    rating: 4.9,
    reviewCount: 445,
    inStock: true,
  },
  {
    id: '7',
    name: 'Leather Messenger Bag',
    description: 'Stylish and functional for daily use',
    price: 129.99,
    image: '/products/bag.jpg',
    category: 'Accessories',
    rating: 4.2,
    reviewCount: 67,
    inStock: false,
  },
  {
    id: '8',
    name: 'Running Shoes Pro',
    description: 'Lightweight and responsive cushioning',
    price: 119.99,
    originalPrice: 149.99,
    image: '/products/shoes.jpg',
    category: 'Sports',
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
  },
  {
    id: '9',
    name: 'Mechanical Keyboard RGB',
    description: 'Tactile switches with customizable lighting',
    price: 129.99,
    image: '/products/keyboard.jpg',
    category: 'Electronics',
    rating: 4.6,
    reviewCount: 156,
    inStock: true,
  },
  {
    id: '10',
    name: 'Standing Desk Converter',
    description: 'Transform any desk into a standing desk',
    price: 249.99,
    originalPrice: 299.99,
    image: '/products/desk.jpg',
    category: 'Furniture',
    rating: 4.4,
    reviewCount: 92,
    inStock: true,
  },
  {
    id: '11',
    name: 'Wireless Gaming Mouse',
    description: 'High precision sensor with low latency',
    price: 89.99,
    image: '/products/mouse.jpg',
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 203,
    inStock: true,
  },
  {
    id: '12',
    name: 'Resistance Bands Set',
    description: 'Complete workout set with 5 resistance levels',
    price: 29.99,
    image: '/products/bands.jpg',
    category: 'Sports',
    rating: 4.3,
    reviewCount: 178,
    inStock: true,
  },
];

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0">
          <ProductFilters />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">All Products</h1>
              <p className="text-sm text-muted-foreground">{allProducts.length} products found</p>
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="relevance">Sort by: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Products Grid */}
          <ProductGrid products={allProducts} columns={3} />

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent" disabled>
              Previous
            </button>
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              1
            </button>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">2</button>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">3</button>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
