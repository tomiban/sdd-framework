#!/usr/bin/env node
import { initialize } from "./lib/init.js";
import { unknownCommandError } from "./lib/messages.js";

const [command = "init", ...rest] = process.argv.slice(2);

if (command !== "init") {
  process.stderr.write(`${unknownCommandError(command)}\n`);
  process.exitCode = 1;
} else {
  const result = await initialize({ root: process.cwd(), args: rest });
  if (result.ok) {
    for (const line of result.lines) {
      process.stdout.write(`${line}\n`);
    }
  } else {
    process.stderr.write(`${result.message}\n`);
  }
  process.exitCode = result.exitCode;
}