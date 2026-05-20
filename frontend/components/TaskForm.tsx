"use client";

import { createTask } from "@/lib/api";
import { useState } from "react";

type Props = {
  onCreated: () => void;
};

export default function TaskForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      await createTask({ title, description });
      setTitle("");
      setDescription("");
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
      <h2 className="font-bold text-lg">新しいタスクを追加</h2>

      <input
        type="text"
        placeholder="タイトル（必須）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
        required
      />

      <textarea
        placeholder="説明（任意）"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded px-3 py-2 text-sm h-20"
      />

      <button
        type="submit"
        disabled={loading || !title}
        className="bg-blue-500 text-white rounded px-4 py-2 text-sm hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "追加中..." : "追加"}
      </button>
    </form>
  );
}