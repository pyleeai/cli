#!/usr/bin/env node
import { proposeCompletions } from "@stricli/core";
import { app } from "../app";
import { buildContext } from "../context";
const inputs = process.argv.slice(3);
if (process.env.COMP_LINE?.endsWith(" ")) {
	inputs.push("");
}
const context = await buildContext(process);
await proposeCompletions(app, inputs, context);
try {
	for (const { completion } of await proposeCompletions(app, inputs, context)) {
		process.stdout.write(`${completion}\n`);
	}
} catch {
	// ignore
}
