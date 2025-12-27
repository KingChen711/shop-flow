# Kubernetes Configuration for ShopFlow

## Directory Structure

```
k8s/
├── base/                    # Common resources for all environments
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── configmaps/
│   ├── secrets/
│   ├── deployments/
│   ├── services/
│   ├── infrastructure/      # Redis, Kafka, Elasticsearch
│   └── ingress/
├── overlays/
│   ├── dev/                 # Development: Postgres in K8s
│   │   ├── kustomization.yaml
│   │   └── databases/       # PostgreSQL StatefulSets
│   ├── staging/             # Staging: AWS RDS
│   │   ├── kustomization.yaml
│   │   └── secrets/         # RDS connection configs
│   └── production/          # Production: AWS RDS with HA
│       ├── kustomization.yaml
│       └── secrets/         # RDS connection configs (use External Secrets)
└── monitoring/              # Prometheus, Grafana, Jaeger, ELK
```

## Usage

### Development (Local K8s with in-cluster Postgres)

```bash
# Apply dev overlay (includes PostgreSQL StatefulSets)
kubectl apply -k overlays/dev/

# Verify all pods are running
kubectl get pods -n shopflow -w
```

### Staging (K8s with AWS RDS)

```bash
# First, update RDS endpoints from Terraform output
# Edit: overlays/staging/secrets/rds-services.yaml

# Apply staging overlay
kubectl apply -k overlays/staging/
```

### Production (K8s with AWS RDS + HA)

```bash
# IMPORTANT: Use External Secrets Operator for credentials
# Never commit real credentials to Git!

# Apply production overlay
kubectl apply -k overlays/production/
```

## Environment Differences

| Feature    | Dev             | Staging | Production         |
| ---------- | --------------- | ------- | ------------------ |
| Database   | Postgres in K8s | AWS RDS | AWS RDS (Multi-AZ) |
| Replicas   | 1               | 2       | 3                  |
| Resources  | Low             | Medium  | High               |
| Log Level  | debug           | info    | warn               |
| Image Tags | latest          | latest  | versioned (v1.0.0) |

## Updating RDS Endpoints

After running Terraform, update the RDS endpoints:

```bash
# Get RDS endpoints from Terraform
cd infrastructure/terraform
terraform output rds_endpoints

# Update the ExternalName services in overlays/staging/secrets/rds-services.yaml
# and overlays/production/secrets/rds-services.yaml
```

## Monitoring

Monitoring resources are in a separate namespace:

```bash
# Apply monitoring stack
kubectl apply -k monitoring/
```
