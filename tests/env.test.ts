import { afterEach, beforeEach, describe, expect, test } from "bun:test";

describe("env", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		delete require.cache[require.resolve("../src/env")];
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	test("environment variables are correctly exported", () => {
		// Act
		const { AUTHORITY, CLIENT_ID, REDIRECT_URI } = require("../src/env");

		// Assert
		expect(typeof AUTHORITY).toBe("string");
		expect(typeof CLIENT_ID).toBe("string");
		expect(typeof REDIRECT_URI).toBe("string");
		expect(AUTHORITY).toBe(process.env.AUTHORITY);
		expect(CLIENT_ID).toBe(process.env.CLIENT_ID);
		expect(REDIRECT_URI).toBe(process.env.REDIRECT_URI);
	});
});
