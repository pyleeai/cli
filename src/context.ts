import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { UserManager } from "oidc-client-ts";
import { Navigator } from "./navigator";
import { authServer } from "./server";
import { settings } from "./settings";
import type { LocalContext, User } from "./types";

export async function buildContext(
	process: NodeJS.Process,
): Promise<LocalContext> {
	const navigator = new Navigator();
	const userManager = new UserManager(settings, navigator);

	return {
		os,
		fs,
		path,
		process,
		user: async () => {
			const user = await userManager.signinSilent().catch(() => null);
			await userManager.storeUser(user);
			return user;
		},
		signIn: async () => {
			let user: User | null = null;
			const auth = authServer({
				signinRedirectCallback: async (url) => {
					user = await userManager.signinRedirectCallback(url);
				},
			});
			await userManager.signinRedirect();
			await auth;
			await userManager.storeUser(user);
			return user;
		},
		signOut: async () => {
			await userManager.removeUser();
		},
	};
}
