# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "task-app-waf"
  scope = "REGIONAL"

  default_action {
    dynamic "block" {
      for_each = var.maintenance_mode ? [1] : []
      content {}
    }

    dynamic "allow" {
      for_each = var.maintenance_mode ? [] : [1]
      content {}
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "task-app-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "task-app-waf"
  }
}

# WAFをALBに紐付け
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}