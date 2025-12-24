# ============================================
# ElastiCache Redis Module
# ============================================

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.name_prefix}-redis-subnet-group"
  description = "ElastiCache subnet group for ${var.name_prefix}"
  subnet_ids  = var.private_subnets

  tags = var.tags
}

# Security Group
resource "aws_security_group" "redis" {
  name        = "${var.name_prefix}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from allowed security groups"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis-sg"
  })
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name        = "${var.name_prefix}-redis-params"
  family      = "redis7"
  description = "Redis parameter group for ${var.name_prefix}"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = var.tags
}

# ElastiCache Replication Group (Redis Cluster Mode Disabled)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.name_prefix}-redis"
  description          = "Redis cluster for ${var.name_prefix}"

  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  engine               = "redis"
  engine_version       = "7.1"

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false  # Set to true if you need in-transit encryption

  # Maintenance
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_window          = "03:00-04:00"
  snapshot_retention_limit = var.environment == "prod" ? 7 : 1

  # Auto failover (requires num_cache_clusters > 1)
  automatic_failover_enabled = var.num_cache_nodes > 1

  # Notifications
  notification_topic_arn = null  # Set to SNS topic ARN if you want notifications

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis"
  })
}
