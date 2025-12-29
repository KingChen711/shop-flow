# ShopFlow AWS Infrastructure (Terraform)

This directory contains Terraform configurations to provision the complete AWS infrastructure for the ShopFlow microservices platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                           VPC (10.0.0.0/16)                         │ │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │ │
│  │  │   Public Subnets    │  │         Private Subnets              │  │ │
│  │  │  ┌───────────────┐  │  │  ┌─────────────────────────────────┐│  │ │
│  │  │  │  NAT Gateway  │  │  │  │           EKS Cluster           ││  │ │
│  │  │  │  (per AZ)     │  │  │  │  ┌─────────┐ ┌─────────┐       ││  │ │
│  │  │  └───────────────┘  │  │  │  │ Node    │ │ Node    │  ...  ││  │ │
│  │  │  ┌───────────────┐  │  │  │  │ Group   │ │ Group   │       ││  │ │
│  │  │  │    ALB/NLB    │  │  │  │  └─────────┘ └─────────┘       ││  │ │
│  │  │  │  (Ingress)    │  │  │  └─────────────────────────────────┘│  │ │
│  │  │  └───────────────┘  │  │                                      │  │ │
│  │  └─────────────────────┘  │  ┌─────────────────────────────────┐│  │ │
│  │                           │  │       Data Stores                ││  │ │
│  │                           │  │  ┌─────────┐ ┌─────────┐        ││  │ │
│  │                           │  │  │   RDS   │ │ ElastiC │        ││  │ │
│  │                           │  │  │ Postgres│ │  Redis  │        ││  │ │
│  │                           │  │  └─────────┘ └─────────┘        ││  │ │
│  │                           │  │  ┌─────────────────────┐        ││  │ │
│  │                           │  │  │    MSK (Kafka)      │        ││  │ │
│  │                           │  │  └─────────────────────┘        ││  │ │
│  │                           │  └─────────────────────────────────┘│  │ │
│  │                           └─────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────┐                                                       │
│  │  S3 Buckets   │  - products (images)                                  │
│  │               │  - uploads                                            │
│  │               │  - backups                                            │
│  └───────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0
3. **kubectl** for Kubernetes management
4. **AWS Account** with necessary permissions

## Quick Start

### 1. Initialize Terraform

```bash
cd infrastructure/terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init
```

### 2. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

### 3. Apply Infrastructure

```bash
terraform apply tfplan
```

### 4. Configure kubectl

```bash
# Get the command from Terraform output
terraform output eks_update_kubeconfig_command

# Run it:
aws eks update-kubeconfig --region us-east-1 --name shopflow-dev-eks
```

## Module Structure

```
terraform/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── terraform.tfvars.example # Example variable values
└── modules/
    ├── vpc/                # VPC, subnets, NAT gateways
    ├── eks/                # EKS cluster and node groups
    ├── rds/                # RDS PostgreSQL
    ├── elasticache/        # ElastiCache Redis
    ├── msk/                # MSK Kafka cluster
    └── s3/                 # S3 buckets
```

## Configuration

### Required Variables

| Variable              | Description         | Example               |
| --------------------- | ------------------- | --------------------- |
| `aws_region`          | AWS region          | `us-east-1`           |
| `environment`         | Environment name    | `dev`, `aws-dev`      |
| `rds_master_password` | RDS master password | (use secrets manager) |

### Optional Variables

See `variables.tf` for all available configuration options.

## Environments

### Development (`dev`)

- Single NAT Gateway
- Smaller instance types
- Minimal redundancy
- Estimated cost: ~$200-300/month

### AWS Development (`aws-dev`)

- AWS managed services (RDS, ElastiCache, MSK)
- Cost-optimized configuration
- Learning-focused setup
- Estimated cost: ~$150-250/month

## Outputs

After applying, the following outputs are available:

```bash
# EKS
terraform output eks_cluster_name
terraform output eks_cluster_endpoint

# RDS
terraform output rds_endpoint

# Redis
terraform output redis_endpoint

# Kafka
terraform output msk_bootstrap_brokers

# S3
terraform output s3_bucket_names
```

## State Management

For production, configure remote state:

```hcl
terraform {
  backend "s3" {
    bucket         = "shopflow-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "shopflow-terraform-locks"
  }
}
```

### Create State Backend

```bash
# Create S3 bucket for state
aws s3 mb s3://shopflow-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket shopflow-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name shopflow-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Security Considerations

1. **Secrets Management**
   - Use AWS Secrets Manager for sensitive values
   - Never commit secrets to Git
   - Use GitHub Secrets for CI/CD

2. **Network Security**
   - All data stores in private subnets
   - Security groups restrict access
   - VPC Flow Logs enabled

3. **Encryption**
   - RDS encryption at rest
   - S3 server-side encryption
   - Redis encryption at rest and in transit

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete all data. Ensure backups are taken first.

## Troubleshooting

### EKS Connection Issues

```bash
# Verify cluster status
aws eks describe-cluster --name shopflow-dev-eks --region us-east-1

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name shopflow-dev-eks

# Test connection
kubectl get nodes
```

### RDS Connection Issues

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <sg-id>

# Test from EKS pod
kubectl run psql-test --image=postgres:16 --rm -it -- \
  psql -h <rds-endpoint> -U shopflow_admin -d user_db
```

## Cost Optimization Tips

1. Use Spot instances for non-production EKS node groups
2. Right-size RDS instances based on actual usage
3. Enable S3 Intelligent-Tiering
4. Use Reserved Instances for predictable workloads
5. Set up AWS Cost Explorer alerts

## License

MIT
