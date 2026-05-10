"use client";

import { useEffect, useRef, useState } from "react";
import { createApp, type Document } from "@zerithdb/sdk";

interface Message {
  text: string;
  senderDid: string;
  senderAlias: string;
  sentAt: number;
}

const pb = createApp({
  appId: "zerithdb-chat-demo",
  sync: {
    signalingUrl: process.env["NEXT_PUBLIC_SIGNALING_URL"] ?? "ws://localhost:4000",
  },
});

pb.sync.enable();

const ALIASES = ["Nova", "Vega", "Lyra", "Orion", "Pyx", "Ara", "Cetus", "Draco"];
const myAlias = ALIASES[Math.floor(Math.random() * ALIASES.length)] ?? "Anon";

export default function ChatApp() {
  const [messages, setMessages] = useState<Document<Message>[]>([]);
  const [input, setInput] = useState("");
  const [myDid, setMyDid] = useState<string | null>(null);
  const [peers, setPeers] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pb.auth.signIn().then((id) => setMyDid(id.did));
    pb.db("messages")
      .find({})
      .then((docs) => {
        setMessages((docs as Document<Message>[]).sort((a, b) => a.sentAt - b.sentAt));
      });
    const interval = setInterval(() => setPeers(pb.network.connectedPeerCount), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (text === "" || myDid === null) return;
    setInput("");

    await pb.db("messages").insert({
      text,
      senderDid: myDid,
      senderAlias: myAlias,
      sentAt: Date.now(),
    } as Message);

    const updated = await pb.db("messages").find({});
    setMessages((updated as Document<Message>[]).sort((a, b) => a.sentAt - b.sentAt));
    inputRef.current?.focus();
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function colorForDid(did: string) {
    const colors = ["#38bdf8", "#a78bfa", "#fb923c", "#34d399", "#f472b6", "#facc15"];
    const idx = did.charCodeAt(did.length - 1) % colors.length;
    return colors[idx] ?? "#38bdf8";
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">
            Peer<span className="text-cyan-400">Chat</span>
          </h1>
          <p className="text-gray-500 text-xs">Built on ZerithDB · No server</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${peers > 0 ? "bg-green-400" : "bg-gray-600"}`} />
          <span className="text-gray-400 text-sm">
            {peers} peer{peers !== 1 ? "s" : ""}
          </span>
          <span className="ml-3 text-xs bg-gray-800 text-cyan-400 px-2 py-1 rounded-full">
            {myAlias}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-700 mt-20 text-sm">
            No messages yet. Say hi! 👋
            <br />
            <span className="text-xs text-gray-800 mt-1 block">
              Open this app in another tab to test P2P sync.
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderDid === myDid;
          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
              >
                {!isMe && (
                  <span
                    className="text-xs font-medium px-1"
                    style={{ color: colorForDid(msg.senderDid) }}
                  >
                    {msg.senderAlias}
                  </span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-cyan-500 text-gray-950 font-medium rounded-br-sm"
                      : "bg-gray-800 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-gray-700 text-xs px-1">{formatTime(msg.sentAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 px-4 py-3 flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 outline-none border border-gray-700 focus:border-cyan-500 transition-colors placeholder-gray-600 text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
