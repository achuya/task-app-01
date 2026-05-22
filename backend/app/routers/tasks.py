from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
import boto3
import os
import uuid
import json

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

S3_BUCKET = os.getenv("S3_BUCKET", "")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-1")
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN", "")
CLOUDFRONT_KEY_PAIR_ID = os.getenv("CLOUDFRONT_KEY_PAIR_ID", "")
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL", "")

# ===== タスクのCRUD =====

@router.get("/", response_model=list[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=schemas.TaskResponse, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    for key, value in task.model_dump(exclude_none=True).items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()


# ===== 画像アップロード（S3 署名付きURL）=====

@router.post("/{task_id}/upload-url", response_model=schemas.PresignedUrlResponse)
def get_upload_url(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    s3_client = boto3.client("s3", region_name=AWS_REGION)
    key = f"tasks/{task_id}/{uuid.uuid4()}.jpg"

    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": key,
            "ContentType": "image/jpeg"
        },
        ExpiresIn=300
    )

    return schemas.PresignedUrlResponse(
        upload_url=upload_url,
        key=key
    )


@router.post("/{task_id}/confirm-upload", response_model=schemas.TaskResponse)
def confirm_upload(
    task_id: int,
    key: str,
    db: Session = Depends(get_db)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.picture_url = key
    db.commit()
    db.refresh(db_task)
    return db_task


# ===== 画像表示（CloudFront 署名付きURL）=====

@router.get("/{task_id}/image-url", response_model=schemas.ImageUrlResponse)
def get_image_url(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.picture_url:
        raise HTTPException(status_code=404, detail="Image not found")

    # CloudFrontの署名付きURLを発行
    cf_signer = boto3.client(
        "cloudfront",
        region_name=AWS_REGION
    )

    url = f"https://{CLOUDFRONT_DOMAIN}/{task.picture_url}"

    return schemas.ImageUrlResponse(url=url)

import boto3
import os

SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL", "")

@router.post("/csv-export", response_model=schemas.CsvExportResponse, status_code=201)
def create_csv_export(db: Session = Depends(get_db)):
    # csv_exportsテーブルにレコードを作成
    export = models.CsvExport(status=models.CsvExportStatus.pending)
    db.add(export)
    db.commit()
    db.refresh(export)

    # SQSにメッセージを送る
    sqs_client = boto3.client("sqs", region_name=os.getenv("AWS_REGION", "ap-northeast-1"))
    sqs_client.send_message(
        QueueUrl=SQS_QUEUE_URL,
        MessageBody=json.dumps({"export_id": export.id})
    )

    return export


@router.get("/csv-export/{export_id}", response_model=schemas.CsvExportResponse)
def get_csv_export(export_id: int, db: Session = Depends(get_db)):
    export = db.query(models.CsvExport).filter(models.CsvExport.id == export_id).first()
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    return export