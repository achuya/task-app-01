from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models import TaskStatus


# ===== Task =====

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.todo


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    picture_url: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    picture_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== 画像アップロード =====

class PresignedUrlResponse(BaseModel):
    upload_url: str
    key: str


class ImageUrlResponse(BaseModel):
    url: str


# ===== CSV出力 =====

class CsvExportResponse(BaseModel):
    id: int
    status: str
    file_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True