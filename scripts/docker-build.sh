#!/bin/bash
# Build all ShopFlow Docker images

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-shopflow}"
TAG="${IMAGE_TAG:-latest}"

echo "Building ShopFlow Docker images..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo ""

# Navigate to shopflow directory
cd "$(dirname "$0")/.."

# Build services
services=(
    "user-service"
    "product-service"
    "order-service"
    "inventory-service"
    "payment-service"
    "notification-service"
    "search-service"
    "cart-service"
    "api-gateway"
)

for service in "${services[@]}"; do
    echo "=========================================="
    echo "Building $service..."
    echo "=========================================="
    docker build \
        -t "$REGISTRY/$service:$TAG" \
        -f "services/$service/Dockerfile" \
        .
    echo "✓ $service built successfully"
    echo ""
done

echo "=========================================="
echo "All images built successfully!"
echo "=========================================="
echo ""
echo "Images created:"
for service in "${services[@]}"; do
    echo "  - $REGISTRY/$service:$TAG"
done
