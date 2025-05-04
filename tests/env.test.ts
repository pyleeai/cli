import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getEnv } from "../src/env";

describe("env", () => {
	const originalEnv = { ...process.env };
	const requiredEnvVars = ["AUTHORITY", "CLIENT_ID", "REDIRECT_URI"];

	beforeEach(() => {
		for (const key of requiredEnvVars) {
			process.env[key] = `test-value-for-${key}`;
		}
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	test("getEnv returns all required environment variables", () => {
		// Arrange
		const expectedValues = {
			AUTHORITY: "test-value-for-AUTHORITY",
			CLIENT_ID: "test-value-for-CLIENT_ID",
			REDIRECT_URI: "test-value-for-REDIRECT_URI",
		};

		// Act
		const env = getEnv();

		// Assert
		expect(env.AUTHORITY).toBe(expectedValues.AUTHORITY);
		expect(env.CLIENT_ID).toBe(expectedValues.CLIENT_ID);
		expect(env.REDIRECT_URI).toBe(expectedValues.REDIRECT_URI);
	});

	test("getEnv throws error when an environment variable is missing", () => {
		// Arrange
		process.env.CLIENT_ID = undefined;

		// Act & Assert
		expect(() => getEnv()).toThrow(
			"Required environment variable CLIENT_ID is missing",
		);
	});

	test("getEnv throws error for each missing environment variable", () => {
		for (const key of requiredEnvVars) {
			// Arrange
			for (const envKey of requiredEnvVars) {
				process.env[envKey] = `test-value-for-${envKey}`;
			}
			delete process.env[key];

			// Act & Assert
			expect(() => getEnv()).toThrow(
				`Required environment variable ${key} is missing`,
			);
		}
	});
});
