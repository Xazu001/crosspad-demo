import type { Command } from "../types";

export const exitCommand: Command = {
  name: "exit",
  description: "Exit admin panel",
  usage: "exit",
  handler: (_args, ctx, log) => {
    log("success", "Exiting admin panel...");
    ctx.navigate("/");
  },
};
