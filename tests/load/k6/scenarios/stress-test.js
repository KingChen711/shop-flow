// ============================================
// Stress Test
// ============================================
// Tests system behavior under extreme load

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

export const options = {
  scenarios: {
    // Stress test with ramping pattern
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Ramp-up to normal load
        { duration: '2m', target: 50 },
        // Stay at normal load
        { duration: '5m', target: 50 },
        // Ramp-up to stress load
        { duration: '2m', target: 100 },
        // Stay at stress load
        { duration: '5m', target: 100 },
        // Ramp-up to breaking point
        { duration: '2m', target: 200 },
        // Stay at breaking point
        { duration: '5m', target: 200 },
        // Peak load
        { duration: '2m', target: 300 },
        // Stay at peak
        { duration: '3m', target: 300 },
        // Scale down
        { duration: '5m', target: 0 },
      ],
    },
  },
  thresholds: {
    // Relaxed thresholds for stress testing
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.1'], // Allow up to 10% errors
    errors: ['rate<0.15'],
  },
};

// Endpoints to test with different weights
const endpoints = [
  { path: '/health', weight: 10, method: 'GET' },
  { path: '/api/products', weight: 30, method: 'GET' },
  { path: '/api/products/1', weight: 25, method: 'GET' },
  { path: '/api/products/search?q=test', weight: 20, method: 'GET' },
  { path: '/api/cart', weight: 10, method: 'GET' },
  { path: '/api/orders', weight: 5, method: 'GET' },
];

// Select endpoint based on weights
function selectEndpoint() {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }

  return endpoints[0];
}

export default function () {
  const endpoint = selectEndpoint();
  const url = `${config.baseUrl}${endpoint.path}`;

  const res = http.get(url, {
    tags: { name: endpoint.path },
  });

  totalRequests.add(1);
  requestDuration.add(res.timings.duration);

  const success = check(res, {
    'status is not 5xx': (r) => r.status < 500,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    failedRequests.add(1);
  }
  errorRate.add(!success);

  // Minimal sleep to maximize load
  sleep(Math.random() * 0.5);
}

export function handleSummary(data) {
  console.log('\n========== STRESS TEST RESULTS ==========');
  console.log(`Total Requests: ${data.metrics.total_requests?.values?.count || 0}`);
  console.log(`Failed Requests: ${data.metrics.failed_requests?.values?.count || 0}`);
  console.log(`Error Rate: ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%`);
  console.log(
    `P95 Response Time: ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms`
  );
  console.log(
    `P99 Response Time: ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0}ms`
  );
  console.log('==========================================\n');

  return {
    'results/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
