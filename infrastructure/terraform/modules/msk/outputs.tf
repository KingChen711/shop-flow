# ============================================
# MSK Module Outputs
# ============================================

output "cluster_arn" {
  description = "MSK cluster ARN"
  value       = aws_msk_cluster.main.arn
}

output "bootstrap_brokers" {
  description = "Plaintext connection string for Kafka brokers"
  value       = aws_msk_cluster.main.bootstrap_brokers
}

output "bootstrap_brokers_tls" {
  description = "TLS connection string for Kafka brokers"
  value       = aws_msk_cluster.main.bootstrap_brokers_tls
}

output "zookeeper_connect" {
  description = "Zookeeper connection string"
  value       = aws_msk_cluster.main.zookeeper_connect_string
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.msk.id
}

output "current_version" {
  description = "Current version of the MSK cluster"
  value       = aws_msk_cluster.main.current_version
}
