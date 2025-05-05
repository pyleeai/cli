import type fs from "node:fs";
import type os from "node:os";
import type path from "node:path";
import type { StricliAutoCompleteContext } from "@stricli/auto-complete";
import type { CommandContext } from "@stricli/core";
import type { IdTokenClaims, User as OidcUser } from "oidc-client-ts";

declare module "bun" {
	interface Env {
		AUTHORITY: string;
		CLIENT_ID: string;
		REDIRECT_URI: string;
	}
}

export interface User extends Omit<OidcUser, "profile"> {
	profile: IdTokenClaims & {
		aud?: string | string[];
		email?: string;
		email_verified?: boolean;
		exp?: number;
		family_name?: string;
		given_name?: string;
		iat?: number;
		iss?: string;
		name?: string;
		picture?: string;
		preferred_username?: string;
		private_metadata?: Record<string, unknown>;
		public_metadata?: Record<string, unknown>;
		rat?: number;
		sub?: string;
		unsafe_metadata?: Record<string, unknown>;
		object?: string;
		instance_id?: string;
		user_id?: string;
		username?: string;
	};
}

export interface LocalContext
	extends CommandContext,
		StricliAutoCompleteContext {
	readonly process: NodeJS.Process;
	readonly os: typeof os;
	readonly fs: typeof fs;
	readonly path: typeof path;
	user: () => Promise<User | null>;
	signIn: () => Promise<User | null>;
	signOut: () => Promise<void>;
}

export const ExitCode = {
	SUCCESS: 0,
	ERROR: 1,
	FAILURE: 2,
	UNAUTHORIZED: -4,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];
