import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { UserStore } from "../src/store";

describe("settings", () => {
	const mockEnv = {
		PYLEE_OIDC_AUTHORITY: "mock-authority",
		PYLEE_OIDC_CLIENT_ID: "mock-client-id",
		PYLEE_OIDC_REDIRECT_URI: "mock-redirect-uri",
		PYLEE_OIDC_PORT: "mock-port",
		PYLEE_CONFIGURATION_URL: "mock-config-url",
	};

	beforeEach(() => {
		mock.module("../src/env", () => mockEnv);
	});

	afterEach(() => {
		mock.restore();
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
		expect(settings.authority).toBe(mockEnv.PYLEE_OIDC_AUTHORITY);
		expect(settings.client_id).toBe(mockEnv.PYLEE_OIDC_CLIENT_ID);
		expect(settings.redirect_uri).toBe(mockEnv.PYLEE_OIDC_REDIRECT_URI);
		expect(settings.response_type).toBe(expectedResponseType);
		expect(settings.scope).toBe(expectedScope);
		expect(settings.loadUserInfo).toBe(expectedLoadUserInfo);
		expect(settings.userStore).toBeInstanceOf(UserStore);
	});
});
