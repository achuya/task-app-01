const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type TaskStatus = "todo" | "doing" | "done";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  picture_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskCreate = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

export type TaskUpdate = {
  title?: string;
  description?: string;
  status?: TaskStatus;
};

// タスク一覧取得
export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/tasks/`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

// タスク作成
export async function createTask(data: TaskCreate): Promise<Task> {
  const res = await fetch(`${API_URL}/tasks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

// タスク更新
export async function updateTask(id: number, data: TaskUpdate): Promise<Task> {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

// タスク削除
export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

// 画像アップロード用署名付きURL取得
export async function getUploadUrl(
  taskId: number
): Promise<{ upload_url: string; key: string }> {
  const res = await fetch(`${API_URL}/tasks/${taskId}/upload-url`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json();
}

// 画像URLを確定
export async function confirmUpload(
  taskId: number,
  key: string
): Promise<Task> {
  const res = await fetch(
    `${API_URL}/tasks/${taskId}/confirm-upload?key=${key}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to confirm upload");
  return res.json();
}

// 画像表示用URL取得
export async function getImageUrl(
  taskId: number
): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/tasks/${taskId}/image-url`);
  if (!res.ok) throw new Error("Failed to get image URL");
  return res.json();
}

// S3に直接アップロード
export async function uploadToS3(
  uploadUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "image/jpeg" },
  });
  if (!res.ok) throw new Error("Failed to upload to S3");
}

// CSV出力リクエスト
export async function createCsvExport(): Promise<CsvExportResponse> {
  const res = await fetch(`${API_URL}/tasks/csv-export`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create CSV export");
  return res.json();
}

// CSV出力状態確認
export async function getCsvExport(id: number): Promise<CsvExportResponse> {
  const res = await fetch(`${API_URL}/tasks/csv-export/${id}`);
  if (!res.ok) throw new Error("Failed to get CSV export");
  return res.json();
}

export type CsvExportResponse = {
  id: number;
  status: string;
  file_url: string | null;
  created_at: string;
};