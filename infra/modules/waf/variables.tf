variable "alb_arn" {
  description = "ALB ARN"
  type        = string
}

variable "maintenance_mode" {
  description = "Enable maintenance mode"
  type        = bool
  default     = false
}