"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createApp, type Document } from "@zerithdb/sdk";

interface Note {
  title: string;
  content: string;
  updatedBy: string;
  color: string;
}

const pb = createApp({
  appId: "zerithdb-notes-demo",
  sync: {
    signalingUrl: process.env["NEXT_PUBLIC_SIGNALING_URL"] ?? "ws://localhost:4000",
  },
});

pb.sync.enable();

const NOTE_COLORS = ["#1e293b", "#1a1a2e", "#0f2027", "#0d1117", "#1c1c1c"];

export default function NotesApp() {
  const [notes, setNotes] = useState<Document<Note>[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myDid, setMyDid] = useState<string>("");
  const [peers, setPeers] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNote = notes.find((n) => n._id === selectedId) ?? null;

  useEffect(() => {
    pb.auth.signIn().then((id) => setMyDid(id.did.slice(-6)));
    loadNotes();
    const interval = setInterval(() => setPeers(pb.network.connectedPeerCount), 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotes() {
    const docs = await pb.db("notes").find({});
    const sorted = (docs as Document<Note>[]).sort((a, b) => b._updatedAt - a._updatedAt);
    setNotes(sorted);
    if (sorted.length > 0 && selectedId === null) {
      setSelectedId(sorted[0]?._id ?? null);
    }
  }

  async function createNote() {
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] ?? "#1e293b";
    const { id } = await pb.db("notes").insert({
      title: "Untitled Note",
      content: "",
      updatedBy: myDid,
      color,
    } as Note);
    await loadNotes();
    setSelectedId(id);
  }

  const autoSave = useCallback(
    (id: string, field: "title" | "content", value: string) => {
      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, [field]: value } : n)));
      setIsSaving(true);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await pb
          .db("notes")
          .update({ _id: id } as never, { $set: { [field]: value, updatedBy: myDid } });
        setIsSaving(false);
      }, 600);
    },
    [myDid]
  );

  async function deleteNote(id: string) {
    await pb.db("notes").delete({ _id: id } as never);
    setSelectedId(null);
    await loadNotes();
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold">
              Peer<span className="text-cyan-400">Notes</span>
            </h1>
            <p className="text-gray-600 text-xs">
              {peers > 0 ? <span className="text-green-500">{peers} syncing</span> : "local only"}
            </p>
          </div>
          <button
            onClick={createNote}
            className="text-cyan-400 hover:text-cyan-300 text-xl transition-colors"
            title="New note"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {notes.length === 0 && (
            <p className="text-gray-700 text-xs text-center mt-6">
              No notes yet.
              <br />
              Click + to create one.
            </p>
          )}
          {notes.map((note) => (
            <button
              key={note._id}
              onClick={() => setSelectedId(note._id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-900 ${
                selectedId === note._id ? "bg-gray-800 border-l-2 border-l-cyan-500" : ""
              }`}
            >
              <p className="text-gray-200 text-sm font-medium truncate">
                {note.title || "Untitled"}
              </p>
              <p className="text-gray-600 text-xs truncate mt-0.5">
                {note.content.slice(0, 40) || "Empty note"}
              </p>
              <p className="text-gray-700 text-xs mt-1">{formatDate(note._updatedAt)}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1 flex flex-col">
        {selectedNote !== null ? (
          <>
            <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
              <input
                className="bg-transparent text-white text-xl font-bold outline-none flex-1 placeholder-gray-700"
                value={selectedNote.title}
                placeholder="Note title..."
                onChange={(e) => autoSave(selectedNote._id, "title", e.target.value)}
              />
              <div className="flex items-center gap-3">
                {isSaving && <span className="text-gray-600 text-xs">Saving…</span>}
                <button
                  onClick={() => deleteNote(selectedNote._id)}
                  className="text-gray-700 hover:text-red-400 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <textarea
              className="flex-1 bg-transparent text-gray-300 text-sm px-6 py-4 outline-none resize-none placeholder-gray-800 leading-relaxed"
              placeholder="Start writing..."
              value={selectedNote.content}
              onChange={(e) => autoSave(selectedNote._id, "content", e.target.value)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-800">
            <div className="text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm">Select a note or create a new one</p>
              <button
                onClick={createNote}
                className="mt-4 text-cyan-600 hover:text-cyan-400 text-sm underline"
              >
                Create first note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
