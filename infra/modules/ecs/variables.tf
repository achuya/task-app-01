variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "backend_sg_id" {
  description = "Backend security group ID"
  type        = string
}

variable "frontend_sg_id" {
  description = "Frontend security group ID"
  type        = string
}

variable "backend_target_group_arn" {
  description = "Backend target group ARN"
  type        = string
}

variable "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  type        = string
}

variable "http_listener_arn" {
  description = "HTTP listener ARN"
  type        = string
}

variable "backend_repository_url" {
  description = "Backend ECR repository URL"
  type        = string
}

variable "frontend_repository_url" {
  description = "Frontend ECR repository URL"
  type        = string
}

variable "task_cpu" {
  description = "ECS task CPU"
  type        = number
}

variable "task_memory" {
  description = "ECS task memory"
  type        = number
}

variable "database_url" {
  description = "Database URL"
  type        = string
  sensitive   = true
}

variable "s3_bucket" {
  description = "S3 bucket name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cloudfront_domain" {
  description = "CloudFront domain name"
  type        = string
}