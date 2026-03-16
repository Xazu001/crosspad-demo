import type { Command } from "../types";

export function createHelpCommand(commands: Command[]): Command {
  return {
    name: "help",
    description: "Show available commands",
    usage: "help [command]",
    handler: (args, _ctx, log) => {
      if (args[0]) {
        const cmd = commands.find((c) => c.name === args[0]);
        if (cmd) {
          log("info", `${cmd.name} - ${cmd.description}`);
          log("info", `Usage: ${cmd.usage}`);
        } else {
          log("error", `Unknown command: ${args[0]}`);
        }
      } else {
        log("info", "Available commands:");
        commands.forEach((cmd) => {
          log("info", `  ${cmd.name.padEnd(15)} - ${cmd.description}`);
        });
      }
    },
  };
}
