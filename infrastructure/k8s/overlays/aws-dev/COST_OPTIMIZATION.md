# AWS Development Environment - Cost Optimization Guide

## Overview

This document outlines the cost optimization strategies implemented in the aws-dev overlay for the ShopFlow microservices platform.

## Cost Optimization Strategies

### 1. Compute Resources (Kubernetes Workloads)

- **Single Replica Deployments**: All services run with 1 replica to minimize compute costs
- **Optimized Resource Limits**:
  - CPU requests: 50m (0.05 cores)
  - CPU limits: 200m (0.2 cores)
  - Memory requests: 64Mi
  - Memory limits: 256Mi
- **t3.micro Compatible**: Resource limits designed to fit within t3.micro instances (1 vCPU, 1GB RAM)

### 2. AWS Managed Services Configuration

#### RDS (PostgreSQL Database)

- **Instance Type**: db.t3.micro
- **Specifications**: 1 vCPU, 1GB RAM
- **Free Tier Eligible**: Yes (750 hours/month for 12 months)
- **Estimated Cost**: ~$15/month (after free tier)

#### ElastiCache (Redis)

- **Instance Type**: cache.t3.micro
- **Specifications**: 1 vCPU, 0.5GB RAM
- **Estimated Cost**: ~$10/month

#### MSK (Managed Kafka)

- **Instance Type**: kafka.t3.small (minimum for MSK)
- **Specifications**: 2 vCPUs, 2GB RAM per broker
- **Brokers**: 3 (minimum for MSK)
- **Estimated Cost**: ~$40/month

### 3. Container Registry (ECR)

- **Storage Cost**: $0.10 per GB-month
- **Data Transfer**: $0.09 per GB
- **Strategy**: Use 'latest' tags for development simplicity
- **Estimated Cost**: ~$5/month for typical development usage

### 4. Removed Local Infrastructure

The following local Kubernetes infrastructure components are removed to use AWS managed services:

- Redis deployment, service, and PVC
- Kafka deployment and service
- Zookeeper deployment and service
- Elasticsearch deployment, service, and PVC

This eliminates the need for persistent storage and reduces compute requirements.

## Total Estimated Monthly Cost

| Service           | Instance Type       | Monthly Cost   |
| ----------------- | ------------------- | -------------- |
| RDS PostgreSQL    | db.t3.micro         | $15            |
| ElastiCache Redis | cache.t3.micro      | $10            |
| MSK Kafka         | kafka.t3.small (3x) | $40            |
| ECR               | Storage + Transfer  | $5             |
| **Total**         |                     | **~$70/month** |

_Note: Costs may vary based on actual usage, data transfer, and AWS region. Free tier benefits can reduce costs for the first 12 months._

## Cost Monitoring Recommendations

1. **Set up AWS Cost Alerts**: Configure billing alerts for $50, $75, and $100 thresholds
2. **Use AWS Cost Explorer**: Monitor daily costs and identify cost spikes
3. **Tag Resources**: Use consistent tagging for cost allocation:
   - `Environment: aws-development`
   - `Project: shopflow`
   - `CostCenter: learning`

## Further Cost Optimization Options

### For Even Lower Costs:

1. **Use LocalStack**: Replace AWS services with LocalStack for local development
2. **Scheduled Shutdowns**: Implement automated start/stop schedules for non-production hours
3. **Spot Instances**: Use spot instances for EKS worker nodes (not recommended for learning environments)
4. **Single AZ Deployment**: Deploy all resources in a single availability zone

### For Production Scaling:

1. **Horizontal Pod Autoscaling**: Implement HPA based on CPU/memory metrics
2. **Cluster Autoscaling**: Use EKS cluster autoscaler for dynamic node scaling
3. **Reserved Instances**: Purchase reserved instances for predictable workloads
4. **Multi-AZ Deployment**: Distribute across multiple availability zones for high availability

## Verification Commands

```bash
# Test the overlay configuration
kubectl apply -k overlays/aws-dev/ --dry-run=client

# Check resource requests and limits
kubectl describe deployments -n shopflow

# Monitor resource usage (after deployment)
kubectl top pods -n shopflow
kubectl top nodes
```

## Security Considerations

Even with cost optimization, maintain security best practices:

- Use AWS IAM roles for service accounts (IRSA)
- Enable VPC flow logs for network monitoring
- Use AWS Secrets Manager for sensitive configuration
- Implement network policies for pod-to-pod communication

## Maintenance Schedule

- **Weekly**: Review AWS Cost Explorer for unexpected charges
- **Monthly**: Analyze resource utilization and adjust limits if needed
- **Quarterly**: Review and update cost optimization strategies
