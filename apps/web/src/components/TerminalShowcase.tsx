"use client";

import { useState, useEffect } from "react";
import { Terminal } from "lucide-react";

const COMMANDS = [
  { text: "npx create-zerith-app my-app", delay: 1000 },
  { text: "Fetching templates...", delay: 2000 },
  { text: "Installing dependencies (pnpm)...", delay: 3500 },
  { text: "Done in 2.1s!", delay: 4500, highlight: true },
  { text: "cd my-app && pnpm dev", delay: 5500 },
  { text: "Server running on http://localhost:3000", delay: 6500, highlight: true },
];

export default function TerminalShowcase() {
  const [lines, setLines] = useState<number>(0);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    COMMANDS.forEach((cmd, i) => {
      const t = setTimeout(() => {
        setLines(i + 1);
      }, cmd.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 text-left w-full max-w-2xl mx-auto">
      <div className="bg-gray-900 px-4 py-3 flex items-center border-b border-gray-800">
        <Terminal className="w-4 h-4 text-gray-400 mr-3" />
        <span className="text-xs text-gray-400 font-mono">bash - zerith-cli</span>
      </div>
      <div className="p-6 font-mono text-sm leading-loose min-h-[240px]">
        {COMMANDS.slice(0, lines).map((cmd, i) => (
          <div key={i} className={`${cmd.highlight ? "text-green-400" : "text-gray-300"}`}>
            {!cmd.highlight && <span className="text-blue-400 mr-2">$</span>}
            {cmd.text}
          </div>
        ))}
        {lines < COMMANDS.length && (
          <div className="animate-pulse w-2 h-4 bg-gray-400 mt-1 inline-block" />
        )}
      </div>
    </div>
  );
}
