variable "bucket_name" {
  description = "S3 bucket name for images"
  type        = string
  default     = "task-app-images"
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  type        = string
}