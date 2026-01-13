/**
 * Seed Script for Products and Categories
 *
 * Usage:
 *   npx tsx scripts/seed-products.ts
 *
 * Or with specific API URL:
 *   API_URL=http://localhost:5000 npx tsx scripts/seed-products.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Auth token (get from login if needed)
let authToken: string | null = null;

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// Login to get auth token
async function login(email: string, password: string): Promise<void> {
  try {
    const response = await apiCall<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authToken = response.accessToken;
    console.log('✅ Logged in successfully');
  } catch (error) {
    console.log('⚠️ Login failed, trying to register...');
    await register(email, password);
  }
}

// Register a new user
async function register(email: string, password: string): Promise<void> {
  const response = await apiCall<{ accessToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
    }),
  });
  authToken = response.accessToken;
  console.log('✅ Registered and logged in successfully');
}

// Fetch all products
async function getProducts(): Promise<{ products: Array<{ id: string }> }> {
  return apiCall('/products?limit=100');
}

// Delete a product
async function deleteProduct(id: string): Promise<void> {
  await apiCall(`/products/${id}`, { method: 'DELETE' });
}

// Fetch all categories
async function getCategories(): Promise<{ categories: Array<{ id: string; name: string }> }> {
  return apiCall('/categories');
}

// Create a category
async function createCategory(data: {
  name: string;
  description?: string;
  parentId?: string;
}): Promise<{ id: string }> {
  return apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Create a product
async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrls?: string[];
  attributes?: Array<{ key: string; value: string }>;
}): Promise<{ id: string }> {
  return apiCall('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Delete all existing products
async function deleteAllProducts(): Promise<void> {
  console.log('\n🗑️  Deleting existing products...');
  const { products } = await getProducts();

  for (const product of products) {
    await deleteProduct(product.id);
    process.stdout.write('.');
  }

  console.log(`\n✅ Deleted ${products.length} products`);
}

// Category definitions
const categoryData = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Fashion and apparel' },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { name: 'Books', description: 'Books and literature' },
  { name: 'Toys & Games', description: 'Toys and games for all ages' },
];

// Product definitions
const productData = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    description:
      'Premium noise-cancelling headphones with 30-hour battery life. Features include active noise cancellation, comfortable over-ear design, and crystal-clear audio quality.',
    price: 149.99,
    category: 'Electronics',
    imageUrls: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    attributes: [
      { key: 'Battery Life', value: '30 hours' },
      { key: 'Connectivity', value: 'Bluetooth 5.2' },
      { key: 'Weight', value: '250g' },
    ],
  },
  {
    name: 'Smart Watch Pro',
    description:
      'Advanced smartwatch with health monitoring, GPS, and 7-day battery life. Track your fitness goals and stay connected on the go.',
    price: 299.99,
    category: 'Electronics',
    imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
    attributes: [
      { key: 'Display', value: '1.4" AMOLED' },
      { key: 'Water Resistance', value: '5ATM' },
      { key: 'Battery', value: '7 days' },
    ],
  },
  {
    name: 'Portable Bluetooth Speaker',
    description:
      'Waterproof portable speaker with 360° sound. Perfect for outdoor adventures with 20-hour playtime.',
    price: 79.99,
    category: 'Electronics',
    imageUrls: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
    attributes: [
      { key: 'Waterproof Rating', value: 'IPX7' },
      { key: 'Battery Life', value: '20 hours' },
      { key: 'Weight', value: '560g' },
    ],
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description:
      'RGB mechanical keyboard with Cherry MX switches. Features customizable lighting and programmable macros.',
    price: 129.99,
    category: 'Electronics',
    imageUrls: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500'],
    attributes: [
      { key: 'Switch Type', value: 'Cherry MX Red' },
      { key: 'Backlight', value: 'RGB' },
      { key: 'Layout', value: 'Full Size' },
    ],
  },
  {
    name: 'Wireless Gaming Mouse',
    description:
      'High-precision wireless gaming mouse with 25,000 DPI sensor and ultra-low latency.',
    price: 89.99,
    category: 'Electronics',
    imageUrls: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'],
    attributes: [
      { key: 'DPI', value: '25,000' },
      { key: 'Battery Life', value: '70 hours' },
      { key: 'Weight', value: '63g' },
    ],
  },

  // Clothing
  {
    name: 'Classic Denim Jacket',
    description:
      'Timeless denim jacket with a modern fit. Made from premium cotton denim with brass buttons.',
    price: 89.99,
    category: 'Clothing',
    imageUrls: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500'],
    attributes: [
      { key: 'Material', value: '100% Cotton Denim' },
      { key: 'Fit', value: 'Regular' },
      { key: 'Care', value: 'Machine Washable' },
    ],
  },
  {
    name: 'Premium Cotton T-Shirt',
    description: 'Soft, breathable cotton t-shirt with a relaxed fit. Perfect for everyday wear.',
    price: 29.99,
    category: 'Clothing',
    imageUrls: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    attributes: [
      { key: 'Material', value: '100% Organic Cotton' },
      { key: 'Fit', value: 'Relaxed' },
      { key: 'Available Sizes', value: 'S, M, L, XL' },
    ],
  },
  {
    name: 'Running Shoes Pro',
    description:
      'Lightweight running shoes with responsive cushioning. Designed for maximum comfort on long runs.',
    price: 139.99,
    category: 'Clothing',
    imageUrls: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    attributes: [
      { key: 'Weight', value: '230g' },
      { key: 'Drop', value: '8mm' },
      { key: 'Sole', value: 'Carbon Fiber Plate' },
    ],
  },

  // Home & Garden
  {
    name: 'Ergonomic Office Chair',
    description:
      'Premium ergonomic chair with lumbar support, adjustable armrests, and breathable mesh back.',
    price: 349.99,
    category: 'Home & Garden',
    imageUrls: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500'],
    attributes: [
      { key: 'Weight Capacity', value: '300 lbs' },
      { key: 'Adjustable Height', value: '17" - 21"' },
      { key: 'Warranty', value: '5 years' },
    ],
  },
  {
    name: 'Standing Desk Converter',
    description:
      'Transform any desk into a standing desk. Features smooth height adjustment and spacious work surface.',
    price: 249.99,
    category: 'Home & Garden',
    imageUrls: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500'],
    attributes: [
      { key: 'Surface Size', value: '36" x 24"' },
      { key: 'Height Range', value: '6" - 20"' },
      { key: 'Weight Capacity', value: '35 lbs' },
    ],
  },
  {
    name: 'Smart LED Desk Lamp',
    description:
      'Modern LED desk lamp with adjustable color temperature and brightness. USB charging port included.',
    price: 59.99,
    category: 'Home & Garden',
    imageUrls: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'],
    attributes: [
      { key: 'Color Temperature', value: '2700K - 6500K' },
      { key: 'Brightness Levels', value: '5' },
      { key: 'Power', value: '12W LED' },
    ],
  },

  // Sports & Outdoors
  {
    name: 'Premium Yoga Mat',
    description:
      'Extra thick yoga mat with non-slip surface. Perfect for yoga, pilates, and floor exercises.',
    price: 49.99,
    category: 'Sports & Outdoors',
    imageUrls: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
    attributes: [
      { key: 'Thickness', value: '6mm' },
      { key: 'Material', value: 'TPE Eco-friendly' },
      { key: 'Size', value: '72" x 24"' },
    ],
  },
  {
    name: 'Resistance Bands Set',
    description:
      'Complete resistance bands set with 5 different resistance levels. Includes carry bag and workout guide.',
    price: 29.99,
    category: 'Sports & Outdoors',
    imageUrls: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500'],
    attributes: [
      { key: 'Resistance Levels', value: '5 (10-50 lbs)' },
      { key: 'Material', value: 'Natural Latex' },
      { key: 'Includes', value: 'Bands, Handles, Door Anchor' },
    ],
  },
  {
    name: 'Camping Tent 4-Person',
    description:
      'Waterproof 4-person camping tent with easy setup. Perfect for family camping trips.',
    price: 199.99,
    category: 'Sports & Outdoors',
    imageUrls: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500'],
    attributes: [
      { key: 'Capacity', value: '4 Person' },
      { key: 'Waterproof Rating', value: '3000mm' },
      { key: 'Setup Time', value: '5 minutes' },
    ],
  },

  // Books
  {
    name: 'The Art of Programming',
    description:
      'A comprehensive guide to modern software development practices. Covers design patterns, testing, and clean code.',
    price: 44.99,
    category: 'Books',
    imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
    attributes: [
      { key: 'Pages', value: '450' },
      { key: 'Format', value: 'Hardcover' },
      { key: 'Language', value: 'English' },
    ],
  },
  {
    name: 'Mindful Leadership',
    description:
      'Discover how mindfulness can transform your leadership style and create positive change in your organization.',
    price: 24.99,
    category: 'Books',
    imageUrls: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'],
    attributes: [
      { key: 'Pages', value: '280' },
      { key: 'Format', value: 'Paperback' },
      { key: 'Author', value: 'Sarah Mitchell' },
    ],
  },

  // Toys & Games
  {
    name: 'Building Blocks Set (500 pcs)',
    description:
      'Creative building blocks set with 500 pieces in various colors and shapes. Perfect for kids ages 4+.',
    price: 39.99,
    category: 'Toys & Games',
    imageUrls: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500'],
    attributes: [
      { key: 'Pieces', value: '500' },
      { key: 'Age', value: '4+' },
      { key: 'Material', value: 'ABS Plastic' },
    ],
  },
  {
    name: 'Strategy Board Game',
    description:
      'Award-winning strategy board game for 2-4 players. Hours of fun for family game nights.',
    price: 49.99,
    category: 'Toys & Games',
    imageUrls: ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500'],
    attributes: [
      { key: 'Players', value: '2-4' },
      { key: 'Play Time', value: '60-90 minutes' },
      { key: 'Age', value: '10+' },
    ],
  },
];

// Main seed function
async function seed() {
  console.log('🌱 Starting seed process...');
  console.log(`📡 API URL: ${API_BASE_URL}\n`);

  try {
    // Step 1: Login
    console.log('🔐 Authenticating...');
    await login('admin@shopflow.com', 'Admin123!');

    // Step 2: Delete existing products
    await deleteAllProducts();

    // Step 3: Get existing categories or create new ones
    console.log('\n📁 Setting up categories...');
    const { categories: existingCategories } = await getCategories();

    const categoryMap: Record<string, string> = {};

    // Map existing categories
    for (const cat of existingCategories) {
      categoryMap[cat.name] = cat.id;
    }

    // Create missing categories
    for (const cat of categoryData) {
      if (!categoryMap[cat.name]) {
        const created = await createCategory(cat);
        categoryMap[cat.name] = created.id;
        console.log(`  ✅ Created category: ${cat.name}`);
      } else {
        console.log(`  ⏭️  Category exists: ${cat.name}`);
      }
    }

    // Step 4: Create products
    console.log('\n📦 Creating products...');

    for (const product of productData) {
      const categoryId = categoryMap[product.category];
      if (!categoryId) {
        console.log(`  ⚠️ Skipping ${product.name}: category "${product.category}" not found`);
        continue;
      }

      await createProduct({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId,
        imageUrls: product.imageUrls,
        attributes: product.attributes,
      });
      console.log(`  ✅ Created: ${product.name}`);
    }

    console.log('\n✨ Seed completed successfully!');
    console.log(`   📁 ${categoryData.length} categories`);
    console.log(`   📦 ${productData.length} products`);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();
