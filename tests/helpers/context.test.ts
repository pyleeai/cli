import { mock } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { LocalContext, User } from "../../src/types";

export interface TestContext extends LocalContext {
	readonly stdout: string;
	readonly stderr: string;
	readonly exitCode?: number;
	readonly reset: () => void;
}

export interface TestContextOptions {
	user?: User | null;
	readonly env?: Record<string, string>;
}

export function buildContextForTest(
	options: TestContextOptions = {},
): TestContext {
	let stdout = "";
	let stderr = "";
	let exitCode: number | undefined;
	const user = options.user ?? null;

	const process = {
		stdout: {
			write: mock((arg: unknown) => {
				stdout += String(arg);
				return stdout;
			}),
		},
		stderr: {
			write: mock((arg: unknown) => {
				stderr += String(arg);
				return stderr;
			}),
		},
		env: options.env,
		exit: (code: number) => {
			exitCode = code;
		},
	} as unknown as NodeJS.Process;

	return {
		os,
		fs,
		path,
		process,
		user: mock(async () => user),
		signIn: mock(async () => user),
		signOut: mock(async () => void 0),
		get stdout() {
			return stdout;
		},
		get stderr() {
			return stderr;
		},
		get exitCode() {
			return exitCode;
		},
		reset: () => {
			stdout = "";
			stderr = "";
			exitCode = undefined;
		},
	};
}
