# ShopFlow AWS Deployment Guide

## 🚀 Automated Deployment

Everything is now automated with Terraform! No manual steps required.

### Prerequisites

1. **Install tools:**
   - [Terraform](https://terraform.io) >= 1.5.0
   - [kubectl](https://kubernetes.io/docs/tasks/tools/) >= 1.28
   - [AWS CLI](https://aws.amazon.com/cli/) >= 2.0

2. **Configure AWS credentials:**

   ```bash
   aws configure
   ```

3. **Update terraform.tfvars:**
   - Copy `terraform.tfvars.example` to `terraform.tfvars`
   - Set your RDS password in the file:
   ```bash
   rds_master_password = "YourSecurePassword123!"
   ```

### Deploy Everything

```bash
cd shopflow/infrastructure/terraform

# Clean up any existing conflicting resources
.\cleanup_existing.ps1

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy infrastructure + Kubernetes resources
terraform apply
```

**That's it!** Terraform will:

- ✅ Create all AWS infrastructure (VPC, EKS, RDS, Redis, Kafka, OpenSearch)
- ✅ Configure security groups with proper VPC CIDR rules
- ✅ Create all required databases in RDS
- ✅ Disable SSL requirement for development
- ✅ Create Kubernetes namespace and RBAC
- ✅ Create ConfigMaps with actual AWS service endpoints
- ✅ Create Secrets with proper database credentials

### Deploy Kubernetes Services

After Terraform completes:

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name shopflow-aws-dev-eks

# Deploy services
kubectl apply -k ../k8s/overlays/aws-dev

# Check status
kubectl get pods -n shopflow -w
```

### Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n shopflow

# Check service logs
kubectl logs -n shopflow -l app=api-gateway

# Port forward to test
kubectl port-forward -n shopflow svc/api-gateway 5000:5000
curl http://localhost:5000/health
```

## 🗑️ Cleanup

```bash
# Delete Kubernetes resources
kubectl delete -k ../k8s/overlays/aws-dev

# Destroy AWS infrastructure
terraform destroy
```

## 🔧 What's Automated

### Infrastructure

- **VPC** with public/private subnets across 3 AZs
- **EKS** cluster with managed node groups
- **RDS PostgreSQL** with all databases:
  - `user_db`, `product_db`, `order_db`
  - `inventory_db`, `payment_db`, `notification_db`
- **ElastiCache Redis** for caching
- **MSK Kafka** for event streaming
- **OpenSearch** for search functionality
- **ECR repositories** for container images
- **S3 buckets** for storage

### Security & Configuration

- **Security groups** with VPC CIDR access rules
- **SSL disabled** in RDS parameter group for development
- **Kubernetes RBAC** for proper access control
- **ConfigMaps** with actual AWS service endpoints
- **Secrets** with correct database credentials

### Cost Optimization

- **t3.micro/small** instances where possible
- **Single AZ** deployment for development
- **Minimal storage** allocations
- **Free tier eligible** services

**Estimated cost: ~$50-80/month**

## 🔍 Troubleshooting

### Common Issues

1. **"Password not found in terraform.tfvars"**

   Make sure you have set the password in `terraform.tfvars`:

   ```bash
   rds_master_password = "YourPassword123!"
   ```

2. **"Resource already exists" (CloudWatch Log Groups)**

   Import existing resources first:

   ```bash
   # Run import script
   .\import_existing_resources.ps1

   # Then apply
   terraform apply
   ```

3. **"ClusterRole deployer already exists"**

   Run the cleanup script first:

   ```bash
   .\cleanup_existing.ps1
   terraform apply
   ```

4. **"OpenSearch domain creation failed - multiple subnets"**

   Fixed in latest version - OpenSearch now uses single subnet for cost optimization.

5. **"Insufficient permissions"**
   - Ensure AWS credentials have admin permissions
   - Check: `aws sts get-caller-identity`

6. **"Resource already exists"**
   - Check for existing resources with same names
   - Use different environment name if needed

7. **"Pods not ready"**
   ```bash
   kubectl describe pod <pod-name> -n shopflow
   kubectl logs <pod-name> -n shopflow
   ```

### Manual Verification

```bash
# Check Terraform outputs
terraform output

# Test database connectivity
kubectl run postgres-test --rm -i --tty --image=postgres:15 --restart=Never \
  --env="PGPASSWORD=ShopFlow2024!SecurePass#Dev123" -- \
  psql -h $(terraform output -raw rds_endpoint) -U shopflow_admin -l

# Check ConfigMaps have correct endpoints
kubectl get configmap common-config-aws -n shopflow -o yaml
```

## 📊 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EKS Cluster   │    │  RDS PostgreSQL │    │ ElastiCache     │
│                 │    │                 │    │ Redis           │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ API Gateway │ │    │ │ user_db     │ │    └─────────────────┘
│ │ Services    │ │◄──►│ │ product_db  │ │
│ │ ...         │ │    │ │ order_db    │ │    ┌─────────────────┐
│ └─────────────┘ │    │ │ ...         │ │    │ MSK Kafka       │
└─────────────────┘    │ └─────────────┘ │    │                 │
                       └─────────────────┘    └─────────────────┘

                       ┌─────────────────┐    ┌─────────────────┐
                       │ OpenSearch      │    │ ECR + S3        │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

All services are automatically configured to connect to the appropriate AWS managed services with proper credentials and SSL settings.
