"use client";

import { Task, updateTask, deleteTask } from "@/lib/api";
import { useState } from "react";

type Props = {
  task: Task;
  onUpdate: () => void;
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  doing: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

const statusLabels = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

export default function TaskCard({ task, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: "todo" | "doing" | "done") => {
    setLoading(true);
    try {
      await updateTask(task.id, { status });
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;
    setLoading(true);
    try {
      await deleteTask(task.id);
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{task.title}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}
        >
          {statusLabels[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm">{task.description}</p>
      )}

      <div className="flex gap-2 mt-2">
        {task.status !== "todo" && (
          <button
            onClick={() => handleStatusChange("todo")}
            disabled={loading}
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            未着手に戻す
          </button>
        )}
        {task.status !== "doing" && (
          <button
            onClick={() => handleStatusChange("doing")}
            disabled={loading}
            className="text-xs px-2 py-1 bg-blue-200 rounded hover:bg-blue-300"
          >
            進行中にする
          </button>
        )}
        {task.status !== "done" && (
          <button
            onClick={() => handleStatusChange("done")}
            disabled={loading}
            className="text-xs px-2 py-1 bg-green-200 rounded hover:bg-green-300"
          >
            完了にする
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-2 py-1 bg-red-200 rounded hover:bg-red-300 ml-auto"
        >
          削除
        </button>
      </div>
    </div>
  );
}