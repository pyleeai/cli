import { describe, expect, test } from "bun:test";
import { signout } from "../../../../src/commands/auth/signout";
import { ExitCode } from "../../../../src/types";
import { buildContextForTest } from "../../../helpers/context.test";

describe("auth signout", () => {
	describe("when user is not signed in", () => {
		test("informs the user they are not signed in", async () => {
			// Arrange
			const context = buildContextForTest({ user: null });

			// Act
			await signout.call(context);

			// Assert
			expect(context.stdout).toContain("Not signed in");
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
			await signout.call(context);

			// Assert
			expect(context.signOut).toHaveBeenCalled();
			expect(context.stdout).toContain(`Signed out ${user.profile.email}`);
			expect(context.exitCode).toBe(ExitCode.SUCCESS);
		});
	});
});
