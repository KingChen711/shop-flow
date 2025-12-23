import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const products = [
  {
    name: 'Wireless Headphones Pro',
    category: 'Electronics',
    sales: 1234,
    revenue: 123400,
    image: '/products/headphones.jpg',
  },
  {
    name: 'Ergonomic Office Chair',
    category: 'Furniture',
    sales: 987,
    revenue: 296100,
    image: '/products/chair.jpg',
  },
  {
    name: 'Smart Watch Series 5',
    category: 'Electronics',
    sales: 856,
    revenue: 342400,
    image: '/products/watch.jpg',
  },
  {
    name: 'Premium Yoga Mat',
    category: 'Sports',
    sales: 743,
    revenue: 29720,
    image: '/products/yoga-mat.jpg',
  },
  {
    name: 'Organic Coffee Beans',
    category: 'Food & Drinks',
    sales: 698,
    revenue: 17450,
    image: '/products/coffee.jpg',
  },
];

export function TopProducts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Best selling products this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(product.revenue)}</p>
                <p className="text-sm text-muted-foreground">{product.sales} sales</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
