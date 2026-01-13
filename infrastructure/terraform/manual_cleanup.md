# Manual Cleanup Commands

Chạy từng lệnh này trong Command Prompt hoặc PowerShell:

## 1. Update kubeconfig (nếu có EKS cluster)

```bash
aws eks update-kubeconfig --region us-east-1 --name shopflow-dev-eks
```

## 2. Xóa Kubernetes resources (ignore errors nếu không tồn tại)

```bash
kubectl delete clusterrole deployer-role --ignore-not-found=true
kubectl delete clusterrole deployers-role --ignore-not-found=true
kubectl delete clusterrolebinding deployer-binding --ignore-not-found=true
kubectl delete clusterrolebinding deployers-binding --ignore-not-found=true
kubectl delete namespace shopflow --ignore-not-found=true --timeout=60s
```

## 3. Xóa CloudWatch Log Groups (ignore errors nếu không tồn tại)

```bash
aws logs delete-log-group --log-group-name "/aws/vpc/shopflow-dev-flow-logs"
aws logs delete-log-group --log-group-name "/aws/opensearch/domains/shopflow-dev-search"
```

## 4. Sau đó chạy Terraform

```bash
terraform init
terraform plan
terraform apply
```

**Lưu ý:** Một số lệnh có thể báo lỗi "not found" - điều này bình thường vì resource không tồn tại.
