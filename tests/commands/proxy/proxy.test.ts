import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import type { User } from "../../../src/types";
import { buildContextForTest } from "../../helpers/context.test";
import { ExitCode } from "../../../src/types";

describe("proxy", () => {
	const mockProxyServer = mock(() =>
		Promise.resolve({ [Symbol.dispose]: mock(() => {}) }),
	);

	beforeAll(() => {
		mock.module("@pyleeai/mcp-proxy-server", () => ({
			MCPProxyServer: mockProxyServer,
		}));

		mock.module("../../../src/env", () => ({
			PYLEE_OIDC_AUTHORITY: "test-authority",
			PYLEE_OIDC_CLIENT_ID: "test-client-id",
			PYLEE_OIDC_REDIRECT_URI: "test-redirect-uri",
			PYLEE_OIDC_PORT: "test-port",
			PYLEE_CONFIGURATION_URL: "http://test:9999/active-registry",
		}));
	});

	afterAll(() => {
		mock.restore();
	});

	test("starts proxy with configured URL when user has token", async () => {
		mockProxyServer.mockClear();
		const user = {
			id_token: "test-token-123",
		} as unknown as User;
		const context = buildContextForTest({ user });
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://test:9999/active-registry",
			{
				headers: { Authorization: "Bearer test-token-123" },
			},
		);
	});

	test("uses mocked configuration URL", async () => {
		mockProxyServer.mockClear();
		const user = {
			id_token: "test-token-456",
		} as unknown as User;
		const context = buildContextForTest({ user });
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://test:9999/active-registry",
			{
				headers: { Authorization: "Bearer test-token-456" },
			},
		);
	});

	test("handles user with undefined token", async () => {
		mockProxyServer.mockClear();
		const user = {} as User;
		const context = buildContextForTest({ user });
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://test:9999/active-registry",
			{
				headers: { Authorization: "Bearer undefined" },
			},
		);
	});

	test("exits with failure when user is null and signIn fails", async () => {
		mockProxyServer.mockClear();
		const context = buildContextForTest({ user: null });
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(context.user).toHaveBeenCalled();
		expect(context.signIn).toHaveBeenCalled();
		expect(context.exitCode).toBe(ExitCode.FAILURE);
		expect(mockProxyServer).not.toHaveBeenCalled();
		expect(context.stderr).toContain("Sign in failed!");
	});

	test("exits with failure when signIn throws error", async () => {
		mockProxyServer.mockClear();
		const context = buildContextForTest({ user: null });
		context.signIn = mock(() => Promise.reject(new Error("Sign in error")));
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(context.user).toHaveBeenCalled();
		expect(context.signIn).toHaveBeenCalled();
		expect(context.exitCode).toBe(ExitCode.FAILURE);
		expect(mockProxyServer).not.toHaveBeenCalled();
		expect(context.stderr).toContain("Sign in error\n");
	});

	test("sets up UserManager event handlers for token management", async () => {
		mockProxyServer.mockClear();
		const user = {
			id_token: "test-token-123",
		} as unknown as User;
		const context = buildContextForTest({ user });
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(
			context.userManager.events.addAccessTokenExpiring,
		).toHaveBeenCalled();
		expect(context.userManager.events.addAccessTokenExpired).toHaveBeenCalled();
		expect(context.userManager.events.addSilentRenewError).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
	});

	test("sets up signal handlers", async () => {
		mockProxyServer.mockClear();
		const user = {
			id_token: "test-token-123",
		} as unknown as User;
		const context = buildContextForTest({ user });
		const mockOn = mock(() => context.process);
		context.process.on = mockOn;
		const { default: proxy } = await import(
			"../../../src/commands/proxy/proxy"
		);

		await proxy.call(context);

		expect(mockOn).toHaveBeenCalledTimes(4);
		expect(mockOn).toHaveBeenCalledWith(
			"unhandledRejection",
			expect.any(Function),
		);
		expect(mockOn).toHaveBeenCalledWith("SIGINT", expect.any(Function));
		expect(mockOn).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
		expect(mockOn).toHaveBeenCalledWith("exit", expect.any(Function));
	});
});
