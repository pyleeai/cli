import { describe, expect, test } from "bun:test";
import { AUTHORITY, CLIENT_ID, REDIRECT_URI } from "../src/env";

describe("env", () => {
	test("environment variables are correctly exported", () => {
		// Act & Assert
		expect(AUTHORITY).toBe(process.env.AUTHORITY);
		expect(CLIENT_ID).toBe(process.env.CLIENT_ID);
		expect(REDIRECT_URI).toBe(process.env.REDIRECT_URI);
	});
});
