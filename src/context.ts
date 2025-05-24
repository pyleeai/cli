import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { UserManager } from "oidc-client-ts";
import { Navigator } from "./navigator";
import { authServer } from "./server";
import { settings } from "./settings";
import type { LocalContext, User } from "./types";

export function buildContext(process: NodeJS.Process): Promise<LocalContext> {
	const navigator = new Navigator();
	const userManager = new UserManager(settings, navigator);

	return Promise.resolve({
		os,
		fs,
		path,
		process,
		userManager,
		user: async () => {
			const user = await userManager.signinSilent().catch(() => null);
			await userManager.storeUser(user);
			return user;
		},
		signIn: async (): Promise<User | null> => {
			let user: User | null = null;
			const abortController = new AbortController();
			const auth = authServer({
				signal: abortController.signal,
				signinRedirectCallback: async (url: string) => {
					user = await userManager.signinRedirectCallback(url);
				},
			});

			try {
				await userManager.signinRedirect();
				await auth;
				await userManager.storeUser(user);
				return user;
			} catch {
				await userManager.storeUser(null);
				return null;
			} finally {
				await new Promise((resolve) => setTimeout(resolve, 0));

				abortController.abort();
			}
		},
		signOut: async () => {
			await userManager.removeUser();
		},
	});
}
