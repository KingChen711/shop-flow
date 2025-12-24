#!/bin/bash
# ============================================
# k6 Load Test Runner
# ============================================

set -e

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:6000"}
RESULTS_DIR="./results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p $RESULTS_DIR

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ShopFlow Load Testing Suite${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Target: ${YELLOW}$BASE_URL${NC}"
echo ""

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    local duration=${3:-"2m"}
    local vus=${4:-"10"}

    echo -e "${YELLOW}Running: $test_name${NC}"
    echo "Duration: $duration, VUs: $vus"
    echo "---"

    k6 run \
        --env BASE_URL=$BASE_URL \
        --env DURATION=$duration \
        --env VUS=$vus \
        --out json=$RESULTS_DIR/${test_name}.json \
        $test_file

    echo ""
}

# Parse command line arguments
TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
    "health")
        run_test "health-check" "scenarios/health-check.js" "1m" "5"
        ;;
    "auth")
        run_test "auth-flow" "scenarios/auth-flow.js" "3m" "10"
        ;;
    "browse")
        run_test "product-browse" "scenarios/product-browse.js" "5m" "20"
        ;;
    "checkout")
        run_test "checkout-flow" "scenarios/checkout-flow.js" "5m" "10"
        ;;
    "stress")
        run_test "stress-test" "scenarios/stress-test.js"
        ;;
    "spike")
        run_test "spike-test" "scenarios/spike-test.js"
        ;;
    "quick")
        echo -e "${GREEN}Running Quick Test Suite${NC}"
        run_test "health-check" "scenarios/health-check.js" "30s" "5"
        run_test "product-browse" "scenarios/product-browse.js" "1m" "10"
        ;;
    "all")
        echo -e "${GREEN}Running Full Test Suite${NC}"
        run_test "health-check" "scenarios/health-check.js" "1m" "10"
        run_test "auth-flow" "scenarios/auth-flow.js" "3m" "15"
        run_test "product-browse" "scenarios/product-browse.js" "5m" "30"
        run_test "checkout-flow" "scenarios/checkout-flow.js" "5m" "15"
        run_test "stress-test" "scenarios/stress-test.js"
        run_test "spike-test" "scenarios/spike-test.js"
        ;;
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Usage: $0 [test_type]"
        echo ""
        echo "Available test types:"
        echo "  health   - Health check endpoint test"
        echo "  auth     - Authentication flow test"
        echo "  browse   - Product browsing test"
        echo "  checkout - Checkout flow test"
        echo "  stress   - Stress test"
        echo "  spike    - Spike test"
        echo "  quick    - Quick smoke test"
        echo "  all      - Run all tests (default)"
        exit 1
        ;;
esac

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Tests Completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Results saved in: ${YELLOW}$RESULTS_DIR${NC}"
