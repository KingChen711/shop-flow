# ============================================
# OpenSearch Module
# ============================================

# Security Group
resource "aws_security_group" "opensearch" {
  name        = "${var.name_prefix}-opensearch-sg"
  description = "Security group for OpenSearch"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTPS from allowed security groups"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  ingress {
    description = "HTTPS from VPC CIDR (for EKS pods)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-opensearch-sg"
  })
}

# OpenSearch Domain
resource "aws_opensearch_domain" "main" {
  domain_name    = "${var.name_prefix}-search"
  engine_version = var.engine_version

  cluster_config {
    instance_type  = var.instance_type
    instance_count = var.instance_count
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = var.volume_size
  }

  vpc_options {
    security_group_ids = [aws_security_group.opensearch.id]
    subnet_ids         = [var.private_subnets[0]] # Single subnet for single-AZ deployment
  }

  # Access policy - simple policy for VPC domain (no IP restrictions)
  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action   = "es:*"
        Resource = "arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.name_prefix}-search/*"
      }
    ]
  })

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_security_options {
    enabled                        = false
    anonymous_auth_enabled         = true
    internal_user_database_enabled = false
  }

  # Remove log publishing to avoid CloudWatch Logs permission issues
  # log_publishing_options {
  #   cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
  #   log_type                 = "INDEX_SLOW_LOGS"
  # }

  # log_publishing_options {
  #   cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
  #   log_type                 = "SEARCH_SLOW_LOGS"
  # }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-opensearch"
  })
}

# CloudWatch Log Group (optional - not used for now)
# resource "aws_cloudwatch_log_group" "opensearch" {
#   name              = "/aws/opensearch/domains/${var.name_prefix}-search"
#   retention_in_days = 7

#   tags = var.tags

#   # Handle existing log group gracefully
#   lifecycle {
#     prevent_destroy = false
#     ignore_changes  = [retention_in_days]
#   }
# }

# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
