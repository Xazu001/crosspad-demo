// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import "./index.admin-terminal.style.scss";

import * as React from "react";

import { cn } from "#/components/utils/cn";
import type { Command, CommandContext, Log, LogEntry, LogType } from "#/lib/admin/types";

// Re-export for convenience
export type { Command, LogEntry } from "#/lib/admin/types";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type AdminTerminalProps = {
  commands: Command[];
  context: CommandContext;
  username?: string;
  hostname?: string;
  className?: string;
};

// ──────────────────────────────────────────────────────────────
// Admin Terminal Component
// ──────────────────────────────────────────────────────────────

export function AdminTerminal({
  commands,
  context,
  username = "admin",
  hostname = "crosspad",
  className,
}: AdminTerminalProps) {
  const [logs, setLogs] = React.useState<LogEntry[]>([
    {
      id: generateId(),
      type: "info",
      message: "Crosspad Admin CLI v1.0.0",
      timestamp: new Date(),
    },
    {
      id: generateId(),
      type: "info",
      message: 'Type "help" for available commands.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [commandHistory, setCommandHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const logsEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new logs are added
  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Focus input on mount and click
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLog = React.useCallback<Log>((type: LogType, message: string) => {
    setLogs((prev) => [...prev, { id: generateId(), type, message, timestamp: new Date() }]);
  }, []);

  const processCommand = React.useCallback(
    async (cmd: string) => {
      if (!cmd.trim()) return;

      // Add command to logs
      addLog("command", cmd);

      // Add to history
      setCommandHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);

      // Parse command
      const parts = cmd.trim().split(/\s+/);
      const commandName = parts[0]?.toLowerCase();
      const args = parts.slice(1);

      // Find and execute command
      const command = commands.find((c) => c.name === commandName);

      if (!command) {
        addLog("error", `Unknown command: ${commandName}. Type "help" for available commands.`);
        return;
      }

      setIsProcessing(true);
      try {
        await command.handler(args, context, addLog);
      } catch (error) {
        addLog("error", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [commands, context, addLog],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessing && input.trim()) {
      processCommand(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] ?? "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] ?? "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const prompt = `${username}@${hostname}`;

  return (
    <div className={cn("admin-terminal", className)} onClick={() => inputRef.current?.focus()}>
      <div className="admin-terminal__header">
        <span className="admin-terminal__title">Admin CLI</span>
        <span className="admin-terminal__status">{isProcessing ? "processing..." : "ready"}</span>
      </div>

      <div className="admin-terminal__logs">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn("admin-terminal__log", `admin-terminal__log--${log.type}`)}
          >
            <span className="admin-terminal__timestamp">[{formatTimestamp(log.timestamp)}]</span>
            {log.type === "command" ? (
              <span className="admin-terminal__command-line">
                <span className="admin-terminal__prompt">{prompt}:~$ </span>
                <span className="admin-terminal__command-text">{log.message}</span>
              </span>
            ) : (
              <span className="admin-terminal__message">{log.message}</span>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="admin-terminal__input-wrapper">
        <span className="admin-terminal__prompt">{prompt}:~$ </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className="admin-terminal__input"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <span className="admin-terminal__cursor" />
      </form>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────────────

function generateId(): string {
  // Fallback for browsers without crypto.randomUUID support
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Simple UUID v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
