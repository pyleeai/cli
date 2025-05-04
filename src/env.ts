import type { Environment } from "./types";

function ensureEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Required environment variable ${key} is missing`);
	}
	return value;
}

export function getEnv(): Environment {
	return {
		AUTHORITY: ensureEnv("AUTHORITY"),
		CLIENT_ID: ensureEnv("CLIENT_ID"),
		REDIRECT_URI: ensureEnv("REDIRECT_URI"),
	};
}
