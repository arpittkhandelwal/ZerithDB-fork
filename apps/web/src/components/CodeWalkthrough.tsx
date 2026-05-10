"use client";

import { useState } from "react";
import { FileCode, Database, RefreshCcw } from "lucide-react";

const CODE_SNIPPETS = {
  setup: {
    icon: FileCode,
    title: "1. Setup App",
    code: `import { createApp } from "zerithdb-sdk";

// Initialize a new local-first app
export const app = createApp({
  appId: "my-workspace",
  sync: {
    // Optional: add signaling server for P2P
    signalingUrl: "wss://signal.zerith.dev"
  }
});`,
  },
  database: {
    icon: Database,
    title: "2. Write Data",
    code: `import { app } from "./app";

// Data is saved instantly to IndexedDB
await app.db("tasks").insert({
  id: "task_123",
  title: "Deploy Landing Page",
  completed: false,
  createdAt: Date.now()
});

// Queries are reactive by default
const tasks = await app.db("tasks").find({ completed: false });`,
  },
  sync: {
    icon: RefreshCcw,
    title: "3. P2P Sync",
    code: `import { app } from "./app";

// Enable WebRTC Peer-to-Peer sync
app.sync.enable();

// Listen to network events
app.network.on("peerConnected", (peer) => {
  console.log("Connected to peer:", peer.id);
});

// Changes made offline will automatically merge
// via CRDTs once connection is re-established.`,
  },
};

export default function CodeWalkthrough() {
  const [activeTab, setActiveTab] = useState<keyof typeof CODE_SNIPPETS>("setup");

  return (
    <div className="bg-[#0D1117] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 flex flex-col md:flex-row border border-gray-800">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 bg-[#161B22] border-r border-gray-800 p-4 flex flex-col gap-2">
        {(Object.keys(CODE_SNIPPETS) as Array<keyof typeof CODE_SNIPPETS>).map((key) => {
          const tab = CODE_SNIPPETS[key];
          const Icon = tab.icon;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* Code Area */}
      <div className="flex-1 p-6 relative min-h-[300px]">
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <pre className="text-sm font-mono text-gray-300 leading-relaxed mt-4 overflow-x-auto">
          <code>
            {CODE_SNIPPETS[activeTab].code.split("\\n").map((line, i) => (
              <div key={i} className="table-row">
                <span className="table-cell select-none text-gray-600 pr-4 text-right">
                  {i + 1}
                </span>
                <span className="table-cell">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
