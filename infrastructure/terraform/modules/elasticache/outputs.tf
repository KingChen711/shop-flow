# ============================================
# ElastiCache Module Outputs
# ============================================

output "primary_endpoint" {
  description = "Primary endpoint address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint" {
  description = "Reader endpoint address"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.redis.id
}

output "replication_group_id" {
  description = "Replication group ID"
  value       = aws_elasticache_replication_group.main.id
}

output "arn" {
  description = "ElastiCache ARN"
  value       = aws_elasticache_replication_group.main.arn
}

output "cluster_id" {
  description = "ElastiCache cluster ID (same as replication group ID)"
  value       = aws_elasticache_replication_group.main.id
}
