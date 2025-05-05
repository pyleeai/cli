import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { UserStore } from "../src/store";

describe("settings", () => {
	const originalEnv = { ...process.env };
	const mockEnv = {
		AUTHORITY: "mock-authority",
		CLIENT_ID: "mock-client-id",
		REDIRECT_URI: "mock-redirect-uri",
	};

	beforeEach(() => {
		for (const [key, value] of Object.entries(mockEnv)) {
			process.env[key] = value;
		}

		delete require.cache[require.resolve("../src/env")];
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	test("settings has the correct structure and properties", () => {
		// Arrange
		const expectedScope =
			"openid profile email public_metadata private_metadata";
		const expectedResponseType = "code";
		const expectedLoadUserInfo = true;

		// Act
		const { settings } = require("../src/settings");

		// Assert
		expect(settings).toBeDefined();
		expect(settings.authority).toBe(mockEnv.AUTHORITY);
		expect(settings.client_id).toBe(mockEnv.CLIENT_ID);
		expect(settings.redirect_uri).toBe(mockEnv.REDIRECT_URI);
		expect(settings.response_type).toBe(expectedResponseType);
		expect(settings.scope).toBe(expectedScope);
		expect(settings.loadUserInfo).toBe(expectedLoadUserInfo);
		expect(settings.userStore).toBeInstanceOf(UserStore);
	});
});
