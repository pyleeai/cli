import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import proxy from "../../../src/commands/proxy/proxy";
import type { User } from "../../../src/types";
import { buildContextForTest } from "../../helpers/context.test";

describe("proxy", () => {
	const mockProxyServer = mock(() =>
		Promise.resolve({ [Symbol.dispose]: mock(() => {}) }),
	);

	beforeAll(() => {
		mock.module("@pyleeai/mcp-proxy-server", () => ({
			MCPProxyServer: mockProxyServer,
		}));
	});

	beforeEach(() => {
		mockProxyServer.mockClear();
	});

	test("starts proxy with configured URL when user has configuration and token", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith("https://example.com/config", {
			headers: { Authorization: "Bearer test-token-123" },
		});
	});

	test("calls proxy with undefined config URL when user has no configurationUrl", async () => {
		// Arrange
		const user = {
			id_token: "test-token-456",
			profile: {
				private_metadata: {},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(undefined, {
			headers: { Authorization: "Bearer test-token-456" },
		});
	});

	test("calls proxy with undefined config URL and token when user has no profile", async () => {
		// Arrange
		const user = {
			id_token: "test-token-789",
		} as unknown as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(undefined, {
			headers: { Authorization: "Bearer test-token-789" },
		});
	});

	test("calls proxy with undefined config URL and token when user object is empty", async () => {
		// Arrange
		const user = {} as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(undefined, {
			headers: { Authorization: "Bearer undefined" },
		});
	});

	test("exits with failure when user is null and signIn fails", async () => {
		// Arrange
		const context = buildContextForTest({ user: null });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(context.signIn).toHaveBeenCalled();
		expect(context.exitCode).toBe(2); // FAILURE
		expect(mockProxyServer).not.toHaveBeenCalled();
		expect(context.stderr).toContain("Sign in failed!");
	});

	test("sets up UserManager event handlers for token management", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(
			context.userManager.events.addAccessTokenExpiring,
		).toHaveBeenCalled();
		expect(context.userManager.events.addAccessTokenExpired).toHaveBeenCalled();
		expect(context.userManager.events.addSilentRenewError).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
	});

	test("maintains zero-downtime during proxy restart", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });
		const oldProxyDispose = mock(() => {});
		const newProxyDispose = mock(() => {});
		mockProxyServer
			.mockReturnValueOnce(
				Promise.resolve({ [Symbol.dispose]: oldProxyDispose }),
			)
			.mockReturnValueOnce(
				Promise.resolve({ [Symbol.dispose]: newProxyDispose }),
			);

		// Act
		await proxy.call(context);
		const tokenExpiringHandler =
			context.userManager.events.addAccessTokenExpiring.mock.calls[0][0];
		await tokenExpiringHandler();

		// Assert
		expect(mockProxyServer).toHaveBeenCalledTimes(2); // Initial + restart
		expect(oldProxyDispose).toHaveBeenCalledTimes(1); // Old proxy disposed
		expect(newProxyDispose).not.toHaveBeenCalled(); // New proxy still running
	});

	test("exits with error when user is null and signIn throws error", async () => {
		// Arrange
		const context = buildContextForTest({ user: null });
		context.signIn = mock(() => Promise.reject(new Error("Sign in error")));

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(context.signIn).toHaveBeenCalled();
		expect(context.exitCode).toBe(1); // ERROR
		expect(mockProxyServer).not.toHaveBeenCalled();
		expect(context.stderr).toContain("Sign in errored!");
	});

	test("handles MCPProxyServer initialization failure", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });
		mockProxyServer.mockRejectedValueOnce(new Error("Proxy server failed"));

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(context.stderr).toContain("Failed to initialize proxy");
	});

	test("handles MCPProxyServer failure with existing proxy running", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });
		const existingProxyDispose = mock(() => {});
		
		// First call succeeds, second call fails
		mockProxyServer
			.mockReturnValueOnce(Promise.resolve({ [Symbol.dispose]: existingProxyDispose }))
			.mockRejectedValueOnce(new Error("Proxy server failed"));

		// Act
		await proxy.call(context);
		const tokenExpiringHandler = context.userManager.events.addAccessTokenExpiring.mock.calls[0][0];
		await tokenExpiringHandler();

		// Assert
		expect(mockProxyServer).toHaveBeenCalledTimes(2);
		expect(context.stderr).toContain("Failed to initialize proxy");
		expect(context.stderr).toContain("Keeping existing proxy running.");
	});

	test("sets up signal handlers when process.on is available", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });
		const mockOn = mock(() => {});
		context.process.on = mockOn;

		// Act
		await proxy.call(context);

		// Assert
		expect(mockOn).toHaveBeenCalledTimes(3);
		expect(mockOn).toHaveBeenCalledWith("SIGINT", expect.any(Function));
		expect(mockOn).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
		expect(mockOn).toHaveBeenCalledWith("exit", expect.any(Function));
	});

	test("does not set up signal handlers when process.on is not available", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });
		// Remove process.on to simulate when it's not available
		delete (context.process as any).on;

		// Act
		await proxy.call(context);

		// Assert - Should complete without error
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
	});

	test("cleanup function disposes proxy and exits with success", async () => {
		// Arrange
		const user = {
			id_token: "test-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user });
		const proxyDispose = mock(() => {});
		mockProxyServer.mockReturnValue(Promise.resolve({ [Symbol.dispose]: proxyDispose }));
		const mockOn = mock(() => {});
		context.process.on = mockOn;

		// Act
		await proxy.call(context);
		
		// Get the cleanup function and call it
		const cleanupFunction = mockOn.mock.calls.find(call => call[0] === "SIGINT")?.[1];
		expect(cleanupFunction).toBeDefined();
		cleanupFunction();

		// Assert
		expect(context.exitCode).toBe(0); // SUCCESS
	});
});
