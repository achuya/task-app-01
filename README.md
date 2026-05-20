# Task App 01

タスク管理アプリケーション - AWS上でフロントエンドとバックエンドを動かす構成

---

## 構成図

ユーザー（ブラウザ）
↓
WAF（メンテナンスモード・攻撃防御）
↓
CloudFront（HTTPS・CDN・画像配信）
↓
ALB（ロードバランサー）
├─ /api/* → バックエンド（FastAPI）
└─ /*     → フロントエンド（Next.js）
↓
ECS Fargate（コンテナ実行）
├─ バックエンド（FastAPI）
└─ フロントエンド（Next.js）
↓
RDS MySQL（データベース）画像の流れ
バックエンド → S3（アップロード）
CloudFront  → S3（表示）

---

## 使用技術

### アプリケーション
| 技術 | 用途 |
|------|------|
| Python + FastAPI | REST APIサーバー |
| Next.js + TypeScript | フロントエンド画面 |
| SQLAlchemy | DBの操作（ORM） |
| Tailwind CSS | スタイリング |

### AWS インフラ
| サービス | 役割 |
|---------|------|
| ECS Fargate | コンテナの実行環境（サーバー管理不要） |
| RDS MySQL | データベース |
| ALB | ロードバランサー（フロント・バックの振り分け） |
| CloudFront | CDN・HTTPS化・画像配信 |
| S3 | 画像・ファイルの保存 |
| ECR | Dockerイメージの保存 |
| WAF | セキュリティ・メンテナンスモード |
| Secrets Manager | パスワードの安全な管理 |
| SSM | 踏み台サーバーへの安全なアクセス |

### ツール
| ツール | 用途 |
|--------|------|
| Terraform | インフラのコード管理（IaC） |
| Docker | アプリのコンテナ化 |
| GitHub Actions | 自動デプロイ（CI/CD） |

---

## ファイル構成

task-app-01/
├── backend/                    ← FastAPI APIサーバー
│   ├── app/
│   │   ├── main.py             ← アプリの入口・CORS設定
│   │   ├── database.py         ← DB接続設定
│   │   ├── models.py           ← DBテーブル定義
│   │   ├── schemas.py          ← APIの入出力の形
│   │   └── routers/
│   │       └── tasks.py        ← タスクAPIの処理
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   ← Next.jsフロントエンド
│   ├── app/
│   │   ├── page.tsx            ← トップページ（/tasksにリダイレクト）
│   │   └── tasks/
│   │       └── page.tsx        ← タスク管理画面
│   ├── components/
│   │   ├── TaskCard.tsx        ← タスクカードコンポーネント
│   │   └── TaskForm.tsx        ← タスク追加フォーム
│   ├── lib/
│   │   └── api.ts              ← APIとの通信処理
│   └── Dockerfile
│
├── infra/                      ← Terraform（インフラ定義）
│   ├── main.tf                 ← 全モジュールを組み合わせる
│   ├── variables.tf            ← 変数の定義
│   ├── outputs.tf              ← 出力値の定義
│   ├── terraform.tfvars        ← 変数の値（gitignore済み）
│   └── modules/
│       ├── network/            ← VPC・サブネット・IGW・NAT
│       ├── security/           ← セキュリティグループ
│       ├── rds/                ← データベース
│       ├── ecr/                ← Dockerイメージの置き場
│       ├── ecs/                ← コンテナの実行環境
│       ├── alb/                ← ロードバランサー
│       ├── cloudfront/         ← CDN・画像配信
│       ├── s3/                 ← 画像・CSVの保存
│       └── waf/                ← メンテナンスモード
│
└── .github/
└── workflows/
├── deploy-backend.yml  ← バックエンド自動デプロイ
└── deploy-frontend.yml ← フロントエンド自動デプロイ

---

## 基本的な知識

### REST APIとは？

HTTPリクエストでデータをやり取りする仕組み
GET    /api/tasks/     → タスク一覧を取得
POST   /api/tasks/     → タスクを作成
PUT    /api/tasks/{id} → タスクを更新
DELETE /api/tasks/{id} → タスクを削除

### Dockerとは？

アプリを「コンテナ」という箱に入れて動かす仕組み
メリット
└─ どの環境でも同じように動く
└─ 依存関係をまとめて管理できる
Dockerfile → コンテナの設計図
イメージ   → Dockerfileから作られた実体
コンテナ   → イメージから起動した実行環境

### GitHub Actionsとは？

GitHubにpushしたときに自動でデプロイする仕組み
git push origin main
↓
GitHub Actionsが起動
↓
Dockerイメージをビルド
↓
ECRにpush
↓
ECSのタスク定義を更新
↓
自動デプロイ完了！

### S3 署名付きURLとは？

期限付きのURLを発行してS3に安全にアクセスする仕組み
画像アップロード
フロント → API（URLください）
API → S3署名付きURL発行（5分間有効）
フロント → S3に直接アップロード
画像表示
フロント → API（画像URLください）
API → CloudFront署名付きURL発行
フロント → CloudFront経由で画像表示

---

## 環境の再構築手順

### 事前準備
```bash
# 必要なツールの確認
terraform --version
docker --version
aws --version
session-manager-plugin --version

# AWSの認証確認
aws sts get-caller-identity
```

### Step1: terraform.tfvarsを作成

```bash
cat > infra/terraform.tfvars << 'EOF'
aws_region           = "ap-northeast-1"
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
db_subnet_cidrs      = ["10.0.5.0/24", "10.0.6.0/24"]
db_name              = "taskdb"
db_username          = "admin"
db_password          = "Password1234!"
task_cpu             = 512
task_memory          = 1024
s3_bucket_name       = "task-app-images-achuya-2026"
EOF
```

### Step2: インフラを構築

```bash
cd infra
terraform init
terraform apply
```

> ⚠️ RDS・CloudFront・WAFの作成に20〜30分かかります

### Step3: ECRにDockerイメージをpush

```bash
# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  058898200941.dkr.ecr.ap-northeast-1.amazonaws.com

# バックエンドをビルド・push
docker buildx build \
  --platform linux/amd64 \
  -t 058898200941.dkr.ecr.ap-northeast-1.amazonaws.com/task-app-backend:latest \
  --push \
  ./backend

# CloudFrontのURLを確認
terraform -chdir=infra output cloudfront_url

# フロントエンドをビルド・push（CloudFrontのURLを使う）
docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://<CloudFrontのURL>/api \
  -t 058898200941.dkr.ecr.ap-northeast-1.amazonaws.com/task-app-frontend:latest \
  --push \
  ./frontend
```

### Step4: ECSサービスを更新

```bash
# バックエンドを更新
aws ecs update-service \
  --cluster task-app-cluster \
  --service task-app-backend-service \
  --force-new-deployment \
  --region ap-northeast-1

# フロントエンドを更新
aws ecs update-service \
  --cluster task-app-cluster \
  --service task-app-frontend-service \
  --force-new-deployment \
  --region ap-northeast-1
```

### Step5: RDSにmigration

```bash
# 踏み台サーバーのIDを確認
terraform -chdir=infra output bastion_instance_id

# SSM経由で接続
aws ssm start-session \
  --target <bastion_instance_id> \
  --region ap-northeast-1
```

踏み台サーバー内で：

```bash
sudo yum install -y python3 python3-pip mysql
pip3 install sqlalchemy pymysql cryptography

python3 << 'EOF'
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import enum

DATABASE_URL = "mysql+pymysql://admin:Password1234!@<rds_endpoint>:3306/taskdb"

engine = create_engine(DATABASE_URL)
Base = declarative_base()

class TaskStatus(str, enum.Enum):
    todo = "todo"
    doing = "doing"
    done = "done"

class CsvExportStatus(str, enum.Enum):
    pending = "pending"
    complete = "complete"

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.todo)
    picture_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class CsvExport(Base):
    __tablename__ = "csv_exports"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(CsvExportStatus), nullable=False, default=CsvExportStatus.pending)
    file_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

Base.metadata.create_all(bind=engine)
print("Migration completed!")
EOF
```

### Step6: 動作確認

```bash
# ヘルスチェック
curl https://<CloudFrontのURL>/health

# ブラウザで確認
open https://<CloudFrontのURL>
```

---

## 環境の削除手順

### Step1: ECRのイメージを削除

```bash
aws ecr delete-repository \
  --repository-name task-app-backend \
  --region ap-northeast-1 \
  --force

aws ecr delete-repository \
  --repository-name task-app-frontend \
  --region ap-northeast-1 \
  --force
```

### Step2: インフラを削除

```bash
cd infra
terraform destroy
```

> ⚠️ NAT Gatewayは課金が続くので使い終わったら必ずdestroyしましょう！

---

## GitHub ActionsのCI/CD設定

### GitHubのSecretsに登録

Settings → Secrets and variables → Actions
AWS_ACCESS_KEY_ID     → AWSのアクセスキーID
AWS_SECRET_ACCESS_KEY → AWSのシークレットアクセスキー

### 自動デプロイの流れ

backend/フォルダを変更してpush
↓
deploy-backend.ymlが起動
↓
Dockerビルド → ECR push → ECSデプロイ
frontend/フォルダを変更してpush
↓
deploy-frontend.ymlが起動
↓
Dockerビルド → ECR push → ECSデプロイ

---

## メンテナンスモードの切り替え

```bash
# メンテナンスモードON
# infra/terraform.tfvarsに以下を追加
# maintenance_mode = true
terraform -chdir=infra apply

# メンテナンスモードOFF
# infra/terraform.tfvarsのmaintenance_modeをfalseに変更
terraform -chdir=infra apply
```

---

## トラブルシューティング

### ECSタスクが起動しない
```bash
# ログを確認
aws logs get-log-events \
  --log-group-name /ecs/task-app-backend \
  --log-stream-name $(aws logs describe-log-streams \
    --log-group-name /ecs/task-app-backend \
    --order-by LastEventTime \
    --descending \
    --query "logStreams[0].logStreamName" \
    --output text) \
  --region ap-northeast-1 \
  --query "events[-20:].message" \
  --output text
```

### APIに接続できない
```bash
# タスクの状態を確認
aws ecs list-tasks \
  --cluster task-app-cluster \
  --region ap-northeast-1

# ヘルスチェック
curl http://<ALBのDNS名>/health
```

### RDSに接続できない
```bash
# 踏み台サーバーに接続してMySQLで確認
aws ssm start-session \
  --target <bastion_instance_id> \
  --region ap-northeast-1

mysql -h <rds_endpoint> -u admin -pPassword1234! taskdb -e "SHOW TABLES;"
```

