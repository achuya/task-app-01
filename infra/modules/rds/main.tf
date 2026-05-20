# DBサブネットグループ
resource "aws_db_subnet_group" "main" {
  name       = "task-app-db-subnet-group"
  subnet_ids = var.db_subnet_ids

  tags = {
    Name = "task-app-db-subnet-group"
  }
}

# RDSインスタンス
resource "aws_db_instance" "main" {
  identifier              = "task-app-db"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  storage_encrypted       = true
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [var.rds_sg_id]
  skip_final_snapshot     = true
  backup_retention_period = 7
  backup_window           = "03:00-04:00"

  tags = {
    Name = "task-app-db"
  }
}