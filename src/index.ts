#!/usr/bin/env node
import { initialize } from "./lib/init.js";
import { unknownCommandError } from "./lib/messages.js";
import { createSpec } from "./lib/new.js";
import { createPhaseFile } from "./lib/phases.js";
import { statusReport } from "./lib/status.js";
import { validateSpec } from "./lib/validate.js";

type CliResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 | 1 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

function print(result: CliResult): void {
  if (result.ok) {
    for (const line of result.lines) {
      process.stdout.write(`${line}\n`);
    }
  } else {
    process.stderr.write(`${result.message}\n`);
  }
  process.exitCode = result.exitCode;
}

const [command = "init", ...rest] = process.argv.slice(2);

if (command === "init") {
  print(await initialize({ root: process.cwd(), args: rest }));
} else if (command === "new") {
  const [slug, ...extra] = rest;
  print(await createSpec({ root: process.cwd(), slug: slug ?? "", args: extra }));
} else if (command === "plan" || command === "tasks") {
  print(await createPhaseFile({ root: process.cwd(), phase: command, args: rest }));
} else if (command === "validate") {
  print(await validateSpec({ root: process.cwd(), args: rest }));
} else if (command === "status") {
  print(await statusReport({ root: process.cwd(), args: rest }));
} else {
  process.stderr.write(`${unknownCommandError(command)}\n`);
  process.exitCode = 1;
}
