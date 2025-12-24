// ============================================
// Checkout Flow Load Test
// ============================================
// Simulates complete purchase flow: cart -> checkout -> payment

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const cartOperationDuration = new Trend('cart_operation_duration');
const checkoutDuration = new Trend('checkout_duration');
const checkoutErrors = new Rate('checkout_errors');
const ordersCreated = new Counter('orders_created');
const cartAbandonment = new Counter('cart_abandonment');

export const options = {
  scenarios: {
    // Simulate checkout patterns
    checkout_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '2m', target: 10 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    ...config.thresholds,
    checkout_errors: ['rate<0.05'],
    checkout_duration: ['p(95)<3000'],
    cart_operation_duration: ['p(95)<500'],
  },
};

// Helper to get auth token
function getAuthToken() {
  const loginRes = http.post(
    `${config.baseUrl}/api/auth/login`,
    JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      return body.accessToken;
    } catch {
      return null;
    }
  }
  return null;
}

export function setup() {
  // Get a valid token for testing
  const token = getAuthToken();
  return { token };
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  // Skip if no token
  if (!token) {
    console.log('No auth token available, skipping checkout flow');
    sleep(5);
    return;
  }

  // Step 1: Add items to cart
  group('Add to Cart', () => {
    const productId = Math.floor(Math.random() * 100) + 1;
    const quantity = Math.floor(Math.random() * 3) + 1;

    const res = http.post(
      `${config.baseUrl}/api/cart/items`,
      JSON.stringify({ productId: String(productId), quantity }),
      { headers, tags: { name: 'AddToCart' } }
    );

    cartOperationDuration.add(res.timings.duration);

    const success = check(res, {
      'add to cart status ok': (r) => r.status >= 200 && r.status < 300,
      'add to cart response time < 500ms': (r) => r.timings.duration < 500,
    });

    checkoutErrors.add(!success);
  });

  sleep(Math.random() * 2 + 1);

  // Step 2: View cart
  group('View Cart', () => {
    const res = http.get(`${config.baseUrl}/api/cart`, {
      headers,
      tags: { name: 'ViewCart' },
    });

    cartOperationDuration.add(res.timings.duration);

    check(res, {
      'view cart status ok': (r) => r.status >= 200 && r.status < 300,
      'view cart response time < 300ms': (r) => r.timings.duration < 300,
    });
  });

  sleep(Math.random() * 3 + 2);

  // Simulate some users abandoning cart (30% abandonment rate)
  if (Math.random() < 0.3) {
    cartAbandonment.add(1);
    sleep(5);
    return;
  }

  // Step 3: Create order (checkout)
  group('Checkout', () => {
    const orderPayload = {
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
      },
      paymentMethod: 'credit_card',
    };

    const res = http.post(`${config.baseUrl}/api/orders`, JSON.stringify(orderPayload), {
      headers,
      tags: { name: 'CreateOrder' },
    });

    checkoutDuration.add(res.timings.duration);

    const success = check(res, {
      'checkout status ok': (r) => r.status >= 200 && r.status < 300,
      'checkout response time < 3s': (r) => r.timings.duration < 3000,
      'order has id': (r) => {
        if (r.status < 200 || r.status >= 300) return true;
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined || body.orderId !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (success && res.status >= 200 && res.status < 300) {
      ordersCreated.add(1);
    }

    checkoutErrors.add(!success);
  });

  sleep(Math.random() * 2 + 1);

  // Step 4: Clear cart after checkout
  group('Clear Cart', () => {
    const res = http.del(`${config.baseUrl}/api/cart`, {
      headers,
      tags: { name: 'ClearCart' },
    });

    cartOperationDuration.add(res.timings.duration);

    check(res, {
      'clear cart status ok': (r) => (r.status >= 200 && r.status < 300) || r.status === 404,
    });
  });

  sleep(5);
}

export function handleSummary(data) {
  return {
    'results/checkout-flow-summary.json': JSON.stringify(data, null, 2),
  };
}
