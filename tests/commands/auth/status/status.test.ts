import { describe, expect, test } from "bun:test";
import { status } from "../../../../src/commands/auth/status";
import { ExitCode } from "../../../../src/types";
import { buildContextForTest } from "../../../helpers/context.test";

describe("auth status", () => {
	describe("when user is not signed in", () => {
		test("informs the user they are not signed in", async () => {
			// Arrange
			const context = buildContextForTest({ user: null });

			// Act
			await status.call(context);

			// Assert
			expect(context.stdout).toContain(
				"Not Signed In\nRun 'pylee auth signin' to authenticate.\n",
			);
			expect(context.exitCode).toBe(ExitCode.UNAUTHORIZED);
		});
	});

	describe("when user is signed in", () => {
		test("signs out successfully", async () => {
			// Arrange
			const user = {
				profile: {
					email: "test@example.com",
				},
			};
			const context = buildContextForTest({ user });

			// Act
			await status.call(context);

			// Assert
			expect(context.stdout).toContain(`Signed in as ${user.profile.email}`);
			expect(context.exitCode).toBe(ExitCode.SUCCESS);
		});
	});
});
