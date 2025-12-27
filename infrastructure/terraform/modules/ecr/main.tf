# ============================================
# ECR Module
# ============================================

# Create ECR repositories
resource "aws_ecr_repository" "repos" {
  for_each = toset(var.repositories)

  name                 = "shopflow/${each.value}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name       = "${var.name_prefix}-ecr-${each.value}"
    Repository = each.value
  })
}

# Lifecycle policy to keep only recent images
resource "aws_ecr_lifecycle_policy" "repos" {
  for_each = toset(var.repositories)

  repository = aws_ecr_repository.repos[each.value].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Repository policy to allow EKS nodes to pull images
resource "aws_ecr_repository_policy" "repos" {
  for_each = toset(var.repositories)

  repository = aws_ecr_repository.repos[each.value].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEKSNodePull"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

