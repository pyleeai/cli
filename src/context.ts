import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { StricliAutoCompleteContext } from "@stricli/auto-complete";
import type { CommandContext } from "@stricli/core";

export interface LocalContext
	extends CommandContext,
		StricliAutoCompleteContext {
	readonly process: NodeJS.Process;
	readonly os: typeof os;
	readonly fs: typeof fs;
	readonly path: typeof path;
}

export function buildContext(process: NodeJS.Process): LocalContext {
	return {
		process,
		os,
		fs,
		path,
	};
}
