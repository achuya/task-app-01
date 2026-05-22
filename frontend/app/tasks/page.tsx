"use client";

import { useEffect, useState } from "react";
import { getTasks, Task, createCsvExport, getCsvExport } from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvExporting, setCsvExporting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCsvExport = async () => {
    setCsvExporting(true);
    try {
      const export_ = await createCsvExport();

      const interval = setInterval(async () => {
        const status = await getCsvExport(export_.id);
        if (status.status === "complete") {
          clearInterval(interval);
          setCsvExporting(false);
          alert(`CSV出力完了！\nS3キー: ${status.file_url}`);
        }
      }, 3000);
    } catch (e) {
      setCsvExporting(false);
      alert("CSV出力に失敗しました");
    }
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">タスク管理</h1>

      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <TaskForm onCreated={fetchTasks} />
        </div>

        <div className="mb-8 flex justify-end">
          <button
            onClick={handleCsvExport}
            disabled={csvExporting}
            className="bg-green-500 text-white rounded px-4 py-2 text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {csvExporting ? "CSV出力中..." : "CSVエクスポート"}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h2 className="font-bold text-gray-600 mb-4">
                未着手 ({todoTasks.length})
              </h2>
              <div className="flex flex-col gap-3">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-gray-600 mb-4">
                進行中 ({doingTasks.length})
              </h2>
              <div className="flex flex-col gap-3">
                {doingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-gray-600 mb-4">
                完了 ({doneTasks.length})
              </h2>
              <div className="flex flex-col gap-3">
                {doneTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}