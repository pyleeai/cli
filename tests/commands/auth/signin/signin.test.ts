import { describe, expect, mock, test } from "bun:test";
import { signin } from "../../../../src/commands/auth/signin";
import type { User } from "../../../../src/types";
import { ExitCode } from "../../../../src/types";
import { buildContextForTest } from "../../../helpers/context.test";

describe("auth signin", () => {
	describe("when user is signed in", () => {
		test("informs the user they are signed in", async () => {
			// Arrange
			const user = {
				profile: {
					email: "test@example.com",
				},
			} as User;
			const context = buildContextForTest({ user });

			// Act
			await signin.call(context);

			// Assert
			expect(context.stdout).toContain(`Signed in as ${user.profile.email}`);
			expect(context.exitCode).toBe(ExitCode.SUCCESS);
		});
	});

	describe("when user is not signed in", () => {
		test("informs the user they are signing in", async () => {
			// Arrange
			const context = buildContextForTest();

			// Act
			await signin.call(context);

			// Assert
			expect(context.stdout).toContain("Signing in...\n");
		});

		test("if the user signs in successfully", async () => {
			// Arrange
			const user = {
				profile: {
					email: "test@example.com",
				},
			} as User;

			const context = buildContextForTest();
			context.signIn = mock(() => Promise.resolve(user));

			// Act
			await signin.call(context);

			// Assert
			expect(context.stdout).toContain("Signing in...");
			expect(context.stdout).toContain(`Signed in as ${user.profile.email}`);
			expect(context.exitCode).toBe(ExitCode.SUCCESS);
		});

		test("if the user sign in fails", async () => {
			// Arrange
			const context = buildContextForTest();
			context.signIn = mock(() => Promise.resolve(null));

			// Act
			await signin.call(context);

			// Assert
			expect(context.stdout).toContain("Signing in...");
			expect(context.stderr).toContain("Sign in failed!");
			expect(context.exitCode).toBe(ExitCode.FAILURE);
		});

		test("if the user sign in errors", async () => {
			// Arrange
			const context = buildContextForTest();
			context.signIn = mock(() => Promise.reject(new Error("Sign in error")));

			// Act
			await signin.call(context);

			// Assert
			expect(context.stdout).toContain("Signing in...");
			expect(context.stderr).toContain("Sign in errored!");
			expect(context.exitCode).toBe(ExitCode.ERROR);
		});
	});
});
