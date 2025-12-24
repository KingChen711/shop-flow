// ============================================
// Authentication Flow Load Test
// ============================================
// Tests login/register/token refresh performance

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import config from '../config.js';

// Custom metrics
const loginErrors = new Rate('login_errors');
const registerErrors = new Rate('register_errors');
const loginDuration = new Trend('login_duration');
const successfulLogins = new Counter('successful_logins');

export const options = {
  scenarios: {
    // Ramping VUs for auth testing
    auth_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 30 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    ...config.thresholds,
    login_errors: ['rate<0.1'],
    login_duration: ['p(95)<1000'],
  },
};

// Generate unique email for each VU
function generateEmail() {
  return `loadtest_${__VU}_${Date.now()}@shopflow.com`;
}

export default function () {
  // Test Registration Flow
  group('Registration', () => {
    const email = generateEmail();
    const registerPayload = JSON.stringify({
      email: email,
      password: 'LoadTest123!',
      firstName: 'Load',
      lastName: 'Test',
    });

    const registerRes = http.post(`${config.baseUrl}/api/auth/register`, registerPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Register' },
    });

    const registerSuccess = check(registerRes, {
      'register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
      'register response time < 2s': (r) => r.timings.duration < 2000,
    });

    registerErrors.add(!registerSuccess);
  });

  sleep(1);

  // Test Login Flow
  group('Login', () => {
    const loginPayload = JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    });

    const loginRes = http.post(`${config.baseUrl}/api/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    });

    loginDuration.add(loginRes.timings.duration);

    const loginSuccess = check(loginRes, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'login response time < 1s': (r) => r.timings.duration < 1000,
      'has access token': (r) => {
        if (r.status !== 200) return true; // Skip if not successful login
        try {
          const body = JSON.parse(r.body);
          return body.accessToken !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (loginRes.status === 200) {
      successfulLogins.add(1);
    }

    loginErrors.add(!loginSuccess);
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'results/auth-flow-summary.json': JSON.stringify(data, null, 2),
  };
}
