# ============================================
# ShopFlow Terraform Outputs
# ============================================

# ============================================
# VPC Outputs
# ============================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# ============================================
# EKS Outputs
# ============================================

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "eks_update_kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

# ============================================
# RDS Outputs
# ============================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.port
}

output "rds_database_names" {
  description = "List of database names created"
  value       = module.rds.database_names
}

# ============================================
# ElastiCache Outputs
# ============================================

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = module.elasticache.primary_endpoint
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = module.elasticache.port
}

# ============================================
# MSK Outputs
# ============================================

output "msk_bootstrap_brokers" {
  description = "MSK bootstrap brokers connection string"
  value       = module.msk.bootstrap_brokers
}

output "msk_zookeeper_connect" {
  description = "MSK Zookeeper connection string"
  value       = module.msk.zookeeper_connect
}

# ============================================
# S3 Outputs
# ============================================

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = module.s3.bucket_names
}

output "s3_bucket_arns" {
  description = "S3 bucket ARNs"
  value       = module.s3.bucket_arns
}

# ============================================
# ECR Outputs
# ============================================

output "ecr_repository_urls" {
  description = "Map of ECR repository names to their URLs"
  value       = module.ecr.repository_urls
}

output "ecr_repository_arns" {
  description = "Map of ECR repository names to their ARNs"
  value       = module.ecr.repository_arns
}

# ============================================
# Connection Strings (for reference)
# ============================================

output "connection_info" {
  description = "Connection information for services"
  value = {
    postgres = {
      host     = module.rds.endpoint
      port     = 5432
      username = var.rds_master_username
      # password is sensitive, not output
    }
    redis = {
      host = module.elasticache.primary_endpoint
      port = 6379
    }
    kafka = {
      bootstrap_servers = module.msk.bootstrap_brokers
    }
  }
  sensitive = true
}
