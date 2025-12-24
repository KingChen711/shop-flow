// ============================================
// Health Check Load Test
// ============================================
// Tests basic API availability and response times

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');

export const options = {
  scenarios: {
    // Constant load test
    constant_load: {
      executor: 'constant-vus',
      vus: config.vus,
      duration: config.duration,
    },
  },
  thresholds: config.thresholds,
};

export default function () {
  const url = `${config.baseUrl}/health`;

  const res = http.get(url, {
    tags: { name: 'HealthCheck' },
  });

  // Track custom metrics
  healthCheckDuration.add(res.timings.duration);

  // Validate response
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/health-check-summary.json': JSON.stringify(data, null, 2),
  };
}
