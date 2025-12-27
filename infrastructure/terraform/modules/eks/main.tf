# ============================================
# EKS Module
# ============================================

# EKS Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name = "${var.name_prefix}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSVPCResourceController" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

# EKS Cluster Security Group
resource "aws_security_group" "cluster" {
  name        = "${var.name_prefix}-eks-cluster-sg"
  description = "Security group for EKS cluster"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eks-cluster-sg"
  })
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${var.name_prefix}-eks"
  role_arn = aws_iam_role.cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = var.private_subnets
    security_group_ids      = [aws_security_group.cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eks"
  })

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.cluster_AmazonEKSVPCResourceController,
  ]
}

# Node Group IAM Role
resource "aws_iam_role" "node" {
  name = "${var.name_prefix}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node.name
}

# Node Security Group
resource "aws_security_group" "node" {
  name        = "${var.name_prefix}-eks-node-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow nodes to communicate with each other"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    self            = true
  }

  ingress {
    description     = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.cluster.id]
  }

  ingress {
    description     = "Allow pods running extension API servers on port 443"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name                                           = "${var.name_prefix}-eks-node-sg"
    "kubernetes.io/cluster/${var.name_prefix}-eks" = "owned"
  })
}

# Allow cluster to communicate with nodes
resource "aws_security_group_rule" "cluster_ingress_node" {
  description              = "Allow worker nodes to communicate with the cluster API Server"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.cluster.id
  source_security_group_id = aws_security_group.node.id
  type                     = "ingress"
}

# EKS Node Groups
resource "aws_eks_node_group" "main" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.name_prefix}-${each.key}"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnets

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type

  scaling_config {
    desired_size = each.value.scaling_config.desired_size
    min_size     = each.value.scaling_config.min_size
    max_size     = each.value.scaling_config.max_size
  }

  update_config {
    max_unavailable = 1
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}-node-group"
  })

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

# OIDC Provider for IAM Roles for Service Accounts (IRSA)
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = var.tags
}

# EKS Add-ons
resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "kube-proxy"

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}

# ============================================
# AWS Auth ConfigMap for EKS Access
# ============================================
# This ConfigMap maps IAM users/roles to Kubernetes RBAC roles
# Required for GitHub Actions and other external access

locals {
  # Extract username from IAM user ARN (format: arn:aws:iam::ACCOUNT:user/USERNAME)
  github_actions_username = var.github_actions_iam_user_arn != "" ? split("/", var.github_actions_iam_user_arn)[1] : ""

  # Build mapRoles YAML (always include node role)
  map_roles_yaml = <<-YAML
- rolearn: ${aws_iam_role.node.arn}
  username: system:node:{{EC2PrivateDNSName}}
  groups:
    - system:bootstrappers
    - system:nodes
YAML

  # Build mapUsers YAML template (only used if IAM user ARN is provided)
  map_users_yaml_template = <<-YAML
- userarn: ${var.github_actions_iam_user_arn}
  username: ${local.github_actions_username}
  groups:
    - system:masters
YAML

  # Build mapUsers YAML (only if GitHub Actions IAM user ARN is provided)
  map_users_yaml = var.github_actions_iam_user_arn != "" ? local.map_users_yaml_template : ""
}

# Update aws-auth ConfigMap to include GitHub Actions IAM user
resource "kubernetes_config_map" "aws_auth" {
  metadata {
    name      = "aws-auth"
    namespace = "kube-system"
  }

  data = {
    mapRoles = local.map_roles_yaml
    mapUsers = local.map_users_yaml
  }

  depends_on = [aws_eks_node_group.main]
}