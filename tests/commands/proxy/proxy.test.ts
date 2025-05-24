import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import proxy from "../../../src/commands/proxy/proxy";
import type { User } from "../../../src/types";
import { buildContextForTest } from "../../helpers/context.test";

type MockFunction = {
	mock: {
		calls: unknown[][];
	};
};

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
		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://localhost:3002/active-registry",
			{
				headers: { Authorization: "Bearer test-token-123" },
			},
		);
	});

	test("calls proxy with default config URL when user has no configurationUrl", async () => {
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
		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://localhost:3002/active-registry",
			{
				headers: { Authorization: "Bearer test-token-456" },
			},
		);
	});

	test("calls proxy with default config URL and token when user has no profile", async () => {
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
		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://localhost:3002/active-registry",
			{
				headers: { Authorization: "Bearer test-token-789" },
			},
		);
	});

	test("calls proxy with default config URL and token when user object is empty", async () => {
		// Arrange
		const user = {} as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(
			"http://localhost:3002/active-registry",
			{
				headers: { Authorization: "Bearer undefined" },
			},
		);
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
		const tokenExpiringHandler = (
			context.userManager.events
				.addAccessTokenExpiring as unknown as MockFunction
		).mock.calls[0]?.[0] as () => void;
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

	test("handles MCPProxyServer initialization failure with silent retry", async () => {
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
		mockProxyServer
			.mockRejectedValueOnce(new Error("Proxy server failed"))
			.mockRejectedValueOnce(new Error("Retry also failed"));

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(2);
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

		// First call succeeds, second call fails, retry also fails - existing proxy continues running
		mockProxyServer
			.mockReturnValueOnce(
				Promise.resolve({ [Symbol.dispose]: existingProxyDispose }),
			)
			.mockRejectedValueOnce(new Error("Proxy server failed"))
			.mockRejectedValueOnce(new Error("Retry also failed"));

		// Act
		await proxy.call(context);
		const tokenExpiringHandler = (
			context.userManager.events
				.addAccessTokenExpiring as unknown as MockFunction
		).mock.calls[0]?.[0] as () => void;
		await tokenExpiringHandler();

		// Assert
		expect(mockProxyServer).toHaveBeenCalledTimes(3);
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
		const mockOn = mock(() => {}) as unknown as MockFunction;
		(context.process as unknown as { on: MockFunction }).on = mockOn;

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
		(context.process as unknown as { on?: unknown }).on = undefined;

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
		mockProxyServer.mockReturnValue(
			Promise.resolve({ [Symbol.dispose]: proxyDispose }),
		);
		const mockOn = mock(() => {}) as unknown as MockFunction;
		(context.process as unknown as { on: MockFunction }).on = mockOn;

		// Act
		await proxy.call(context);

		// Get the cleanup function and call it
		const cleanupFunction = (mockOn as MockFunction).mock.calls.find(
			(call: unknown[]) => call[0] === "SIGINT",
		)?.[1] as (() => void) | undefined;
		expect(cleanupFunction).toBeDefined();
		cleanupFunction?.();

		// Assert
		expect(context.exitCode).toBe(0); // SUCCESS
	});

	test("handles access token expired event", async () => {
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
		const tokenExpiredHandler = (
			context.userManager.events
				.addAccessTokenExpired as unknown as MockFunction
		).mock.calls[0]?.[0] as () => void;
		await tokenExpiredHandler();

		// Assert
		expect(mockProxyServer).toHaveBeenCalledTimes(2); // Initial + restart from expired event
	});

	test("handles silent renew error event", async () => {
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
		const silentRenewErrorHandler = (
			context.userManager.events.addSilentRenewError as unknown as MockFunction
		).mock.calls[0]?.[0] as () => void;
		await silentRenewErrorHandler();

		// Assert
		expect(mockProxyServer).toHaveBeenCalledTimes(2); // Initial + restart from silent renew error event
	});

	test("handles proxy failure retry with signIn failure", async () => {
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

		// First MCPProxyServer call fails, then signIn returns null on retry
		mockProxyServer.mockRejectedValueOnce(new Error("Proxy server failed"));
		context.signIn = mock(() => Promise.resolve(null));

		// Mock user() to return null after signOut is called
		let userSignedOut = false;
		context.user = mock(async () => (userSignedOut ? null : user));
		context.signOut = mock(async () => {
			userSignedOut = true;
		});

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(context.signOut).toHaveBeenCalled();
		expect(context.signIn).toHaveBeenCalled();
		expect(context.stderr).toContain("Sign in failed!");
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
	});

	test("handles proxy failure retry with successful signIn and existing proxy", async () => {
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
		const retryProxyDispose = mock(() => {});

		// Mock user() to return null after signOut is called
		let userSignedOut = false;
		context.user = mock(async () => (userSignedOut ? null : user));
		context.signOut = mock(async () => {
			userSignedOut = true;
		});

		// First call succeeds (creates existing proxy), second call fails, retry succeeds
		mockProxyServer
			.mockReturnValueOnce(
				Promise.resolve({ [Symbol.dispose]: existingProxyDispose }),
			)
			.mockRejectedValueOnce(new Error("Proxy server failed"))
			.mockReturnValueOnce(
				Promise.resolve({ [Symbol.dispose]: retryProxyDispose }),
			);

		// Act - initial proxy call
		await proxy.call(context);

		// Simulate token expiring which triggers retry logic
		const tokenExpiringHandler = (
			context.userManager.events
				.addAccessTokenExpiring as unknown as MockFunction
		).mock.calls[0]?.[0] as () => void;
		await tokenExpiringHandler();

		// Assert
		expect(context.signOut).toHaveBeenCalled();
		expect(context.signIn).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(3);
		expect(existingProxyDispose).toHaveBeenCalledTimes(1);
	});

	test("handles proxy failure retry where both attempts fail with no existing proxy", async () => {
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

		// Both MCPProxyServer calls fail (initial and retry) - silently continues
		mockProxyServer
			.mockRejectedValueOnce(new Error("Proxy server failed"))
			.mockRejectedValueOnce(new Error("Retry also failed"));

		// Act
		await proxy.call(context);

		// Assert
		expect(mockProxyServer).toHaveBeenCalledTimes(2);
	});

	test("silently handles invalid token from different authority by forcing fresh authentication", async () => {
		// Arrange
		const oldUser = {
			id_token: "old-authority-token-123",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const newUser = {
			id_token: "new-authority-token-456",
			profile: {
				private_metadata: {
					configurationUrl: "https://example.com/config",
				},
			},
		} as unknown as User;
		const context = buildContextForTest({ user: oldUser });
		const newProxyDispose = mock(() => {});

		// Mock user() to return null after signOut, then return newUser after signIn
		let userSignedOut = false;
		context.user = mock(async () => (userSignedOut ? null : oldUser));
		context.signOut = mock(async () => {
			userSignedOut = true;
		});
		context.signIn = mock(() => Promise.resolve(newUser));

		// First MCPProxyServer call fails with auth error, retry succeeds with fresh token
		mockProxyServer
			.mockRejectedValueOnce(new Error("Unauthorized"))
			.mockReturnValueOnce(
				Promise.resolve({ [Symbol.dispose]: newProxyDispose }),
			);

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(context.signOut).toHaveBeenCalled(); // Should sign out old user
		expect(context.signIn).toHaveBeenCalled(); // Should sign in with new authority
		expect(mockProxyServer).toHaveBeenCalledTimes(2);

		// Verify first call used old token
		expect(mockProxyServer).toHaveBeenNthCalledWith(
			1,
			"http://localhost:3002/active-registry",
			{ headers: { Authorization: "Bearer old-authority-token-123" } },
		);

		// Verify retry call used new token
		expect(mockProxyServer).toHaveBeenNthCalledWith(
			2,
			"http://localhost:3002/active-registry",
			{ headers: { Authorization: "Bearer new-authority-token-456" } },
		);
	});
});
