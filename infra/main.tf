provider "aws" {
  region = var.aws_region
}

# ネットワーク
module "network" {
  source               = "./modules/network"
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  db_subnet_cidrs      = var.db_subnet_cidrs
}

# セキュリティグループ
module "security" {
  source = "./modules/security"
  vpc_id = module.network.vpc_id
}

# RDS
module "rds" {
  source        = "./modules/rds"
  db_subnet_ids = module.network.db_subnet_ids
  rds_sg_id     = module.security.rds_sg_id
  db_name       = var.db_name
  db_username   = var.db_username
  db_password   = var.db_password
}

# ECR
module "ecr" {
  source = "./modules/ecr"
}

# S3（CloudFrontのARNが必要なので後で設定）
module "s3" {
  source                      = "./modules/s3"
  cloudfront_distribution_arn = module.cloudfront.cloudfront_distribution_arn
}

# ALB
module "alb" {
  source            = "./modules/alb"
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  alb_sg_id         = module.security.alb_sg_id
}

# CloudFront
module "cloudfront" {
  source                = "./modules/cloudfront"
  alb_dns_name          = module.alb.alb_dns_name
  s3_bucket_domain_name = module.s3.bucket_domain_name
  s3_bucket_name        = module.s3.bucket_name
}

# WAF
module "waf" {
  source           = "./modules/waf"
  alb_arn          = module.alb.alb_arn
  maintenance_mode = var.maintenance_mode
}

# ECS
module "ecs" {
  source                    = "./modules/ecs"
  vpc_id                    = module.network.vpc_id
  private_subnet_ids        = module.network.private_subnet_ids
  backend_sg_id             = module.security.backend_sg_id
  frontend_sg_id            = module.security.frontend_sg_id
  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  http_listener_arn         = module.alb.http_listener_arn
  backend_repository_url    = module.ecr.backend_repository_url
  frontend_repository_url   = module.ecr.frontend_repository_url
  task_cpu                  = var.task_cpu
  task_memory               = var.task_memory
  database_url              = "mysql+pymysql://${var.db_username}:${var.db_password}@${module.rds.endpoint}:3306/${var.db_name}"
  s3_bucket                 = module.s3.bucket_name
  aws_region                = var.aws_region
  cloudfront_domain         = module.cloudfront.cloudfront_domain_name
}