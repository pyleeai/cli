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
			access_token: "test-token-123",
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
			access_token: "test-token-456",
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
			access_token: "test-token-789",
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

	test("calls proxy with undefined config URL and token when user is null (unauthenticated)", async () => {
		// Arrange
		const context = buildContextForTest({ user: null });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(undefined, {
			headers: { Authorization: "Bearer undefined" },
		});
	});
});
