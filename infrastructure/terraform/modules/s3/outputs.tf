# ============================================
# S3 Module Outputs
# ============================================

output "bucket_ids" {
  description = "Map of bucket names to IDs"
  value       = { for k, v in aws_s3_bucket.main : k => v.id }
}

output "bucket_arns" {
  description = "Map of bucket names to ARNs"
  value       = { for k, v in aws_s3_bucket.main : k => v.arn }
}

output "bucket_names" {
  description = "List of bucket names"
  value       = [for v in aws_s3_bucket.main : v.id]
}

output "bucket_regional_domain_names" {
  description = "Map of bucket names to regional domain names"
  value       = { for k, v in aws_s3_bucket.main : k => v.bucket_regional_domain_name }
}
