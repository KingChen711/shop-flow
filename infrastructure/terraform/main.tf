# ============================================
# ShopFlow AWS Infrastructure
# ============================================
# This Terraform configuration provisions the complete
# AWS infrastructure for the ShopFlow microservices platform.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "shopflow-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "shopflow-terraform-locks"
  # }
}

# ============================================
# Provider Configuration
# ============================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ShopFlow"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Configure Kubernetes provider after EKS is created
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# ============================================
# Data Sources
# ============================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================
# Local Values
# ============================================

locals {
  name_prefix = "shopflow-${var.environment}"

  azs = slice(data.aws_availability_zones.available.names, 0, 3)

  common_tags = {
    Project     = "ShopFlow"
    Environment = var.environment
  }
}

# ============================================
# Modules
# ============================================

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  name_prefix = local.name_prefix
  environment = var.environment

  vpc_cidr             = var.vpc_cidr
  availability_zones   = local.azs
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  name_prefix = local.name_prefix
  environment = var.environment

  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids

  cluster_version = var.eks_cluster_version

  node_groups = var.eks_node_groups

  tags = local.common_tags
}

# RDS PostgreSQL (Multiple databases)
module "rds" {
  source = "./modules/rds"

  name_prefix = local.name_prefix
  environment = var.environment

  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids

  # Allow access from EKS nodes
  allowed_security_groups = [module.eks.node_security_group_id]

  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage

  # Database names for each service
  databases = [
    "user_db",
    "product_db",
    "order_db",
    "inventory_db",
    "payment_db",
    "notification_db"
  ]

  master_username = var.rds_master_username
  master_password = var.rds_master_password

  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  name_prefix = local.name_prefix
  environment = var.environment

  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids

  allowed_security_groups = [module.eks.node_security_group_id]

  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_nodes

  tags = local.common_tags
}

# MSK Kafka
module "msk" {
  source = "./modules/msk"

  name_prefix = local.name_prefix
  environment = var.environment

  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids

  allowed_security_groups = [module.eks.node_security_group_id]

  kafka_version     = var.msk_kafka_version
  instance_type     = var.msk_instance_type
  number_of_brokers = var.msk_number_of_brokers
  ebs_volume_size   = var.msk_ebs_volume_size

  tags = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"

  name_prefix = local.name_prefix
  environment = var.environment

  # Bucket names
  buckets = [
    "products", # Product images
    "uploads",  # User uploads
    "backups"   # Database backups
  ]

  tags = local.common_tags
}

# ============================================
# Kubernetes Resources (after EKS is ready)
# ============================================

# Create namespace
resource "kubernetes_namespace" "shopflow" {
  depends_on = [module.eks]

  metadata {
    name = "shopflow"

    labels = {
      name        = "shopflow"
      environment = var.environment
    }
  }
}

# Store RDS connection info in K8s secret
# Note: All services share the same RDS instance but use different database names
# Terraform automatically base64-encodes data field
resource "kubernetes_secret" "database_credentials" {
  depends_on = [kubernetes_namespace.shopflow]

  metadata {
    name      = "database-credentials"
    namespace = "shopflow"
  }

  data = {
    host     = module.rds.endpoint
    port     = "5432"
    username = var.rds_master_username
    password = var.rds_master_password
  }

  type = "Opaque"
}

# Store Redis connection info in K8s secret
# Format: ElastiCache endpoint (e.g., "shopflow-dev-redis.xxxxx.cache.amazonaws.com")
# Note: In production, K8s overlays will override common-config to use this
resource "kubernetes_secret" "redis_credentials" {
  depends_on = [kubernetes_namespace.shopflow]

  metadata {
    name      = "redis-credentials"
    namespace = "shopflow"
  }

  data = {
    host = module.elasticache.primary_endpoint
    port = tostring(module.elasticache.port)
  }

  type = "Opaque"
}

# Store Kafka connection info in K8s ConfigMap
# MSK bootstrap_brokers format: "broker1:9092,broker2:9092"
# This matches KAFKA_BROKERS format expected by services (comma-separated)
resource "kubernetes_config_map" "kafka_config" {
  depends_on = [kubernetes_namespace.shopflow]

  metadata {
    name      = "kafka-config"
    namespace = "shopflow"
  }

  data = {
    # MSK bootstrap_brokers is already in correct format: "broker1:9092,broker2:9092"
    bootstrap_servers = module.msk.bootstrap_brokers
    # Also provide as KAFKA_BROKERS for direct use (matches common-config format)
    KAFKA_BROKERS = module.msk.bootstrap_brokers
  }
}
