// ============================================
// Product Browsing Load Test
// ============================================
// Simulates users browsing products, searching, and viewing details

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const productListDuration = new Trend('product_list_duration');
const productDetailDuration = new Trend('product_detail_duration');
const searchDuration = new Trend('search_duration');
const browseErrors = new Rate('browse_errors');
const pageViews = new Counter('page_views');

export const options = {
  scenarios: {
    // Simulate browsing patterns
    browse_products: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    ...config.thresholds,
    product_list_duration: ['p(95)<500'],
    product_detail_duration: ['p(95)<300'],
    search_duration: ['p(95)<800'],
  },
};

// Sample search terms
const searchTerms = [
  'laptop',
  'phone',
  'headphones',
  'camera',
  'watch',
  'keyboard',
  'mouse',
  'monitor',
  'tablet',
  'speaker',
];

export default function () {
  // List products (main catalog page)
  group('Product List', () => {
    const page = Math.floor(Math.random() * 5) + 1;
    const limit = 20;

    const res = http.get(`${config.baseUrl}/api/products?page=${page}&limit=${limit}`, {
      tags: { name: 'ProductList' },
    });

    productListDuration.add(res.timings.duration);
    pageViews.add(1);

    const success = check(res, {
      'list status is 200': (r) => r.status === 200,
      'list response time < 500ms': (r) => r.timings.duration < 500,
      'list has data array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) || Array.isArray(body.items);
        } catch {
          return false;
        }
      },
    });

    browseErrors.add(!success);
  });

  sleep(Math.random() * 2 + 1); // 1-3 seconds

  // View product detail
  group('Product Detail', () => {
    // Use a random product ID (1-100 for testing)
    const productId = Math.floor(Math.random() * 100) + 1;

    const res = http.get(`${config.baseUrl}/api/products/${productId}`, {
      tags: { name: 'ProductDetail' },
    });

    productDetailDuration.add(res.timings.duration);
    pageViews.add(1);

    const success = check(res, {
      'detail status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'detail response time < 300ms': (r) => r.timings.duration < 300,
    });

    browseErrors.add(!success && res.status !== 404);
  });

  sleep(Math.random() * 3 + 2); // 2-5 seconds (reading product)

  // Search products
  group('Product Search', () => {
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const res = http.get(
      `${config.baseUrl}/api/products/search?q=${encodeURIComponent(searchTerm)}`,
      {
        tags: { name: 'ProductSearch' },
      }
    );

    searchDuration.add(res.timings.duration);
    pageViews.add(1);

    const success = check(res, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 800ms': (r) => r.timings.duration < 800,
    });

    browseErrors.add(!success);
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'results/product-browse-summary.json': JSON.stringify(data, null, 2),
  };
}
