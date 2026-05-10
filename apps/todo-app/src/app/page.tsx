"use client";

import { useEffect, useRef, useState } from "react";
import { createApp, type Document } from "@zerithdb/sdk";

// ── Types ────────────────────────────────────────────────────────────────────

interface Todo {
  text: string;
  done: boolean;
  createdBy?: string;
}

// ── ZerithDB app singleton ────────────────────────────────────────────────────

const pb = createApp({
  appId: "zerithdb-todo-demo",
  sync: {
    signalingUrl:
      process.env["NEXT_PUBLIC_SIGNALING_URL"] ?? "ws://localhost:4000",
  },
});

pb.sync.enable();

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodoApp() {
  const [todos, setTodos] = useState<Document<Todo>[]>([]);
  const [input, setInput] = useState("");
  const [identity, setIdentity] = useState<string | null>(null);
  const [peers, setPeers] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sign in and load identity
    pb.auth.signIn().then((id) => setIdentity(id.did.slice(-8)));

    // Initial load
    pb.db("todos")
      .find({})
      .then((docs) =>
        setTodos((docs as Document<Todo>[]).sort((a, b) => a._createdAt - b._createdAt))
      );

    // Track peers
    const interval = setInterval(() => {
      setPeers(pb.network.connectedPeerCount);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function addTodo() {
    const text = input.trim();
    if (text === "") return;
    setInput("");
    inputRef.current?.focus();

    await pb.db("todos").insert({
      text,
      done: false,
      createdBy: identity ?? "anonymous",
    } as Todo);

    const updated = await pb.db("todos").find({});
    setTodos(
      (updated as Document<Todo>[]).sort((a, b) => a._createdAt - b._createdAt)
    );
  }

  async function toggleTodo(id: string, current: boolean) {
    await pb.db("todos").update({ _id: id } as never, { $set: { done: !current } });
    const updated = await pb.db("todos").find({});
    setTodos(
      (updated as Document<Todo>[]).sort((a, b) => a._createdAt - b._createdAt)
    );
  }

  async function deleteTodo(id: string) {
    await pb.db("todos").delete({ _id: id } as never);
    setTodos((prev) => prev.filter((t) => t._id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Peer<span className="text-cyan-400">Base</span> Todo
          </h1>
          <p className="text-gray-400 text-sm">
            Local-first · P2P sync ·{" "}
            <span className={peers > 0 ? "text-green-400" : "text-gray-500"}>
              {peers} peer{peers !== 1 ? "s" : ""} connected
            </span>
          </p>
          {identity && (
            <p className="text-gray-600 text-xs mt-1">
              You: <code className="text-cyan-600">…{identity}</code>
            </p>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-cyan-500 transition-colors placeholder-gray-500"
            placeholder="Add a todo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
          />
          <button
            onClick={addTodo}
            className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            Add
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-4 text-xs text-gray-500">
          <span>{todos.filter((t) => !t.done).length} remaining</span>
          <span>·</span>
          <span>{todos.filter((t) => t.done).length} completed</span>
        </div>

        {/* Todo list */}
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo._id}
              className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 group hover:border-gray-700 transition-colors"
            >
              <button
                onClick={() => toggleTodo(todo._id, todo.done)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  todo.done
                    ? "border-cyan-400 bg-cyan-400"
                    : "border-gray-600 hover:border-cyan-500"
                }`}
              />
              <span
                className={`flex-1 text-sm transition-colors ${
                  todo.done ? "line-through text-gray-600" : "text-gray-200"
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo._id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <div className="text-center text-gray-700 py-12 text-sm">
            No todos yet. Add one above ↑
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-8">
          Built with{" "}
          <a href="https://zerithdb.dev" className="text-cyan-800 hover:text-cyan-600">
            ZerithDB
          </a>{" "}
          · Works offline · No backend
        </p>
      </div>
    </div>
  );
}
