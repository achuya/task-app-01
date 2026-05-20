output "cloudfront_url" {
  description = "CloudFront URL"
  value       = "https://${module.cloudfront.cloudfront_domain_name}"
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "backend_ecr_url" {
  description = "Backend ECR URL"
  value       = module.ecr.backend_repository_url
}

output "frontend_ecr_url" {
  description = "Frontend ECR URL"
  value       = module.ecr.frontend_repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "bastion_instance_id" {
  description = "Bastion instance ID"
  value       = module.ecs.bastion_instance_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}