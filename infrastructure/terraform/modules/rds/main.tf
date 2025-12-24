# ============================================
# RDS PostgreSQL Module
# ============================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "${var.name_prefix}-db-subnet-group"
  description = "Database subnet group for ${var.name_prefix}"
  subnet_ids  = var.private_subnets

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from allowed security groups"
    from_port       = 5432
    to_port         = 5432
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
    Name = "${var.name_prefix}-rds-sg"
  })
}

# Parameter Group for PostgreSQL
resource "aws_db_parameter_group" "main" {
  name        = "${var.name_prefix}-pg-params"
  family      = "postgres16"
  description = "PostgreSQL parameter group for ${var.name_prefix}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries taking more than 1 second
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = var.tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-postgres"

  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2  # Auto-scaling up to 2x

  db_name  = var.databases[0]  # Default database
  username = var.master_username
  password = var.master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  # Storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Backup
  backup_retention_period = var.environment == "prod" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  # Availability
  multi_az = var.environment == "prod" ? true : false

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  # Other settings
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.name_prefix}-final-snapshot" : null
  deletion_protection       = var.environment == "prod"

  # Enable IAM authentication
  iam_database_authentication_enabled = true

  # CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres"
  })
}

# Create additional databases using null_resource
# Note: In production, consider using a separate tool like Flyway or a Lambda function
resource "null_resource" "create_databases" {
  count = length(var.databases) > 1 ? 1 : 0

  triggers = {
    databases = join(",", var.databases)
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Additional databases to create: ${join(", ", slice(var.databases, 1, length(var.databases)))}"
      echo "Note: Create these databases manually or via a migration tool after the RDS instance is ready."
      echo "Connection: psql -h ${aws_db_instance.main.endpoint} -U ${var.master_username} -d ${var.databases[0]}"
    EOT
  }

  depends_on = [aws_db_instance.main]
}
