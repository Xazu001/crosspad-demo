export type UserData = {
  user_id: string;
  user_name: string | null;
  user_namespace: string | null;
  user_verified: boolean | null;
  user_status: string | null;
  created_on: string | null;
}[];

// ──────────────────────────────────────────────────────────────
// Log Types
// ──────────────────────────────────────────────────────────────

export type LogType = "info" | "success" | "error" | "warning" | "command";

export type LogEntry = {
  id: string;
  type: LogType;
  message: string;
  timestamp: Date;
};

export type Log = (type: LogType, message: string) => void;

// ──────────────────────────────────────────────────────────────
// Command Types
// ──────────────────────────────────────────────────────────────

export type CommandContext = {
  navigate: (path: string) => void;
};

export type Command = {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[], ctx: CommandContext, log: Log) => Promise<void> | void;
};
