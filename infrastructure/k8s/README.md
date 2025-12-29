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
│   └── aws-dev/             # AWS Development: AWS managed services
│       ├── kustomization.yaml
│       └── secrets/         # AWS service connection configs
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

### AWS Development (K8s with AWS managed services)

```bash
# First, ensure AWS services are provisioned via Terraform
# Update AWS service endpoints if needed
# Edit: overlays/aws-dev/secrets/aws-services.yaml

# Apply aws-dev overlay
kubectl apply -k overlays/aws-dev/

# Verify deployment
kubectl get pods -n shopflow -w
```

## Environment Differences

| Feature       | Dev               | AWS-Dev                      |
| ------------- | ----------------- | ---------------------------- |
| Database      | Postgres in K8s   | AWS RDS (db.t3.micro)        |
| Cache         | Redis in K8s      | ElastiCache (cache.t3.micro) |
| Message Queue | Kafka in K8s      | MSK or Kafka in K8s          |
| Replicas      | 1                 | 1                            |
| Resources     | Low               | Low (cost optimized)         |
| Log Level     | debug             | info                         |
| Image Source  | Local/DockerHub   | ECR                          |
| Purpose       | Local development | AWS learning environment     |

## Updating AWS Service Endpoints

After running Terraform for AWS resources, update the service endpoints:

```bash
# Get AWS service endpoints from Terraform
cd infrastructure/terraform
terraform output aws_service_endpoints

# Update the ExternalName services in overlays/aws-dev/secrets/aws-services.yaml
```

## Monitoring

Monitoring resources are in a separate namespace:

```bash
# Apply monitoring stack
kubectl apply -k monitoring/
```
