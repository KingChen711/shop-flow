#!/bin/bash
# Deploy ShopFlow to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================="
echo "ShopFlow Kubernetes Deployment"
echo -e "==========================================${NC}"

# Navigate to k8s directory
cd "$(dirname "$0")/../k8s"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check cluster connection
echo -e "\n${YELLOW}Checking Kubernetes cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    echo "Please ensure your cluster is running and kubectl is configured"
    exit 1
fi
echo -e "${GREEN}✓ Connected to cluster${NC}"

# Create namespace first
echo -e "\n${YELLOW}Creating namespace...${NC}"
kubectl apply -f namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"

# Apply ConfigMaps
echo -e "\n${YELLOW}Applying ConfigMaps...${NC}"
kubectl apply -f configmaps/
echo -e "${GREEN}✓ ConfigMaps applied${NC}"

# Apply Secrets
echo -e "\n${YELLOW}Applying Secrets...${NC}"
kubectl apply -f secrets/
echo -e "${GREEN}✓ Secrets applied${NC}"

# Deploy Infrastructure
echo -e "\n${YELLOW}Deploying infrastructure (Redis, Kafka, Elasticsearch)...${NC}"
kubectl apply -f infrastructure/
echo -e "${GREEN}✓ Infrastructure deployed${NC}"

# Wait for infrastructure to be ready
echo -e "\n${YELLOW}Waiting for infrastructure to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=redis -n shopflow --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=kafka -n shopflow --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=elasticsearch -n shopflow --timeout=180s || true
echo -e "${GREEN}✓ Infrastructure ready${NC}"

# Deploy Services
echo -e "\n${YELLOW}Deploying services...${NC}"
kubectl apply -f deployments/
echo -e "${GREEN}✓ Deployments applied${NC}"

# Apply Service definitions
echo -e "\n${YELLOW}Applying Service definitions...${NC}"
kubectl apply -f services/
echo -e "${GREEN}✓ Services applied${NC}"

# Apply Ingress
echo -e "\n${YELLOW}Applying Ingress configuration...${NC}"
kubectl apply -f ingress/
echo -e "${GREEN}✓ Ingress applied${NC}"

# Show status
echo -e "\n${GREEN}=========================================="
echo "Deployment Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Checking pod status..."
kubectl get pods -n shopflow

echo ""
echo "Checking services..."
kubectl get svc -n shopflow

echo ""
echo -e "${YELLOW}To access the API Gateway:${NC}"
echo "  - Via Ingress: http://api.shopflow.local (add to /etc/hosts)"
echo "  - Via NodePort: http://localhost:30000"
echo ""
echo -e "${YELLOW}To check logs:${NC}"
echo "  kubectl logs -f deployment/api-gateway -n shopflow"
echo ""
echo -e "${YELLOW}To delete everything:${NC}"
echo "  kubectl delete namespace shopflow"
