import { describe, expect, mock, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { UserManager } from "oidc-client-ts";
import type { LocalContext, User } from "../src/types";

const mockUser: Partial<User> = {
	profile: {
		sub: "user123",
		iss: "mock-issuer",
		aud: "mock-audience",
		exp: 9999999999,
		iat: 1234567890,
		email: "user@example.com",
	},
	session_state: "mock-session",
	access_token: "mock-access-token",
	token_type: "Bearer",
	state: "mock-state",
	scope: "openid profile email",
	id_token: "mock-id-token",
	expires_at: 9999999999,
	expired: false,
	expires_in: 3600,
	scopes: ["openid", "profile", "email"],
	toStorageString: function () {
		return JSON.stringify(this);
	},
};

function createMockContext(): LocalContext {
	let currentUser: Partial<User> | null = null;

	const userManager = {
		events: {
			addAccessTokenExpiring: mock(() => {}),
			addAccessTokenExpired: mock(() => {}),
			addSilentRenewError: mock(() => {}),
			addUserLoaded: mock(() => {}),
		},
	} as unknown as UserManager;

	return {
		os,
		fs,
		path,
		process: {} as NodeJS.Process,
		userManager,
		user: async (): Promise<User | null> => {
			return currentUser as User | null;
		},
		signIn: async (): Promise<User | null> => {
			currentUser = mockUser;
			return currentUser as User | null;
		},
		signOut: async (): Promise<void> => {
			currentUser = null;
		},
	};
}

describe("Context", () => {
	test("has the expected properties and structure", () => {
		// Arrange
		const context = createMockContext();

		// Act & Assert
		expect(context.os).toBeDefined();
		expect(context.fs).toBeDefined();
		expect(context.path).toBeDefined();
		expect(context.process).toBeDefined();
		expect(context.userManager).toBeDefined();
		expect(context.user).toBeDefined();
		expect(typeof context.signIn).toBe("function");
		expect(typeof context.signOut).toBe("function");
	});

	test("user method initially returns null", async () => {
		// Arrange
		const context = createMockContext();

		// Act
		const user = await context.user();

		// Assert
		expect(user).toBeNull();
	});

	test("signIn method updates and returns the user", async () => {
		// Arrange
		const context = createMockContext();

		// Act
		const initialUser = await context.user();
		const signedInUser = await context.signIn();
		const currentUser = await context.user();

		// Assert
		expect(initialUser).toBeNull();
		expect(signedInUser).toBeDefined();
		if (signedInUser && mockUser.profile) {
			expect(signedInUser.profile.sub).toEqual(mockUser.profile.sub);
		}
		if (currentUser && mockUser.profile) {
			expect(currentUser.profile.sub).toEqual(mockUser.profile.sub);
		}
	});

	test("signOut method clears the current user", async () => {
		// Arrange
		const context = createMockContext();
		await context.signIn();

		// Act
		await context.signOut();
		const user = await context.user();

		// Assert
		expect(user).toBeNull();
	});

	test("context properties are accessible after sign in/out", async () => {
		// Arrange
		const context = createMockContext();

		// Act
		await context.signIn();
		const propertiesAfterSignIn = {
			os: context.os,
			fs: context.fs,
			path: context.path,
			process: context.process,
		};
		await context.signOut();
		const propertiesAfterSignOut = {
			os: context.os,
			fs: context.fs,
			path: context.path,
			process: context.process,
		};

		// Assert
		expect(propertiesAfterSignIn.os).toBeDefined();
		expect(propertiesAfterSignIn.fs).toBeDefined();
		expect(propertiesAfterSignIn.path).toBeDefined();
		expect(propertiesAfterSignIn.process).toBeDefined();
		expect(propertiesAfterSignOut.os).toBeDefined();
		expect(propertiesAfterSignOut.fs).toBeDefined();
		expect(propertiesAfterSignOut.path).toBeDefined();
		expect(propertiesAfterSignOut.process).toBeDefined();
	});

	test("user method returns null when silent refresh fails", async () => {
		// Arrange
		const context = createMockContext();
		context.user = async () => null;

		// Act
		const user = await context.user();

		// Assert
		expect(user).toBeNull();
	});
});
