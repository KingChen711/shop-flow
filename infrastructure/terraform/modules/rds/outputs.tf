# ============================================
# RDS Module Outputs
# ============================================

output "endpoint" {
  description = "RDS instance endpoint (hostname)"
  value       = split(":", aws_db_instance.main.endpoint)[0]
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "database_names" {
  description = "List of database names"
  value       = var.databases
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}
