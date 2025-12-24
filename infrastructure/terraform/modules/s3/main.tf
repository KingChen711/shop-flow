# ============================================
# S3 Module
# ============================================

# S3 Buckets
resource "aws_s3_bucket" "main" {
  for_each = toset(var.buckets)

  bucket = "${var.name_prefix}-${each.value}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.value}"
  })
}

# Block public access
resource "aws_s3_bucket_public_access_block" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning
resource "aws_s3_bucket_versioning" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle rules for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = aws_s3_bucket.main

  bucket = each.value.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  rule {
    id     = "expire-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # For non-current versions (when versioning is enabled)
  dynamic "rule" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      id     = "noncurrent-version-expiration"
      status = "Enabled"

      noncurrent_version_expiration {
        noncurrent_days = 90
      }
    }
  }
}

# CORS configuration for products bucket (for image uploads)
resource "aws_s3_bucket_cors_configuration" "products" {
  count  = contains(var.buckets, "products") ? 1 : 0
  bucket = aws_s3_bucket.main["products"].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]  # Restrict in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
