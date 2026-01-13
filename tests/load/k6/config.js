// ============================================
// k6 Load Test Configuration
// ============================================

export const config = {
  // Base URL for API Gateway
  baseUrl: __ENV.BASE_URL || 'http://localhost:5000',

  // Default test duration
  duration: __ENV.DURATION || '5m',

  // Virtual users
  vus: parseInt(__ENV.VUS) || 10,

  // Target RPS
  targetRps: parseInt(__ENV.TARGET_RPS) || 100,

  // Thresholds
  thresholds: {
    // 95% of requests should complete under 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    // Error rate should be below 1%
    http_req_failed: ['rate<0.01'],
    // 99% of iterations should complete
    iteration_duration: ['p(99)<5000'],
  },

  // Test user credentials
  testUser: {
    email: 'loadtest@shopflow.com',
    password: 'LoadTest123!',
  },
};

export default config;
