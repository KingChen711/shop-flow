// ============================================
// Spike Test
// ============================================
// Tests system behavior with sudden load spikes

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const spikeResponseTime = new Trend('spike_response_time');
const recoveryTime = new Trend('recovery_time');
const requestsPerSpike = new Counter('requests_per_spike');

export const options = {
  scenarios: {
    // Spike test pattern
    spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        // Warm-up
        { duration: '1m', target: 10 },
        // First spike
        { duration: '10s', target: 200 },
        { duration: '30s', target: 200 },
        // Recovery
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        // Second spike (higher)
        { duration: '10s', target: 300 },
        { duration: '30s', target: 300 },
        // Recovery
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        // Third spike (highest)
        { duration: '10s', target: 400 },
        { duration: '30s', target: 400 },
        // Final recovery
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    // Expect some degradation during spikes
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.2'],
    errors: ['rate<0.25'],
  },
};

export default function () {
  const endpoints = ['/health', '/api/products', '/api/products/1'];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const url = `${config.baseUrl}${endpoint}`;

  const startTime = Date.now();
  const res = http.get(url, {
    tags: { name: 'SpikeTest' },
  });
  const duration = Date.now() - startTime;

  requestsPerSpike.add(1);
  spikeResponseTime.add(res.timings.duration);

  const success = check(res, {
    'status is not 5xx': (r) => r.status < 500,
    'response received': (r) => r.body !== null,
  });

  errorRate.add(!success);

  // Very short sleep during spikes
  sleep(Math.random() * 0.2);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorPct = (data.metrics.errors?.values?.rate || 0) * 100;

  console.log('\n========== SPIKE TEST RESULTS ==========');
  console.log(`P95 Response Time During Spikes: ${p95.toFixed(2)}ms`);
  console.log(`Error Rate During Spikes: ${errorPct.toFixed(2)}%`);

  // Analyze recovery
  if (errorPct < 5) {
    console.log('✅ System handled spikes well');
  } else if (errorPct < 15) {
    console.log('⚠️  System showed degradation during spikes');
  } else {
    console.log('❌ System struggled with spike load');
  }

  console.log('==========================================\n');

  return {
    'results/spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}
