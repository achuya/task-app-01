variable "bucket_name" {
  description = "S3 bucket name for images"
  type        = string
  default     = "task-app-images-achuya-2026"
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  type        = string
}