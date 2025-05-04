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

	test("starts proxy with configured URL when user has configuration", async () => {
		// Arrange
		const user = {
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
		expect(mockProxyServer).toHaveBeenCalledWith("https://example.com/config");
	});

	test("handles missing configuration URL gracefully", async () => {
		// Arrange
		const user = {} as User;
		const context = buildContextForTest({ user });

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(undefined);
	});

	test("handles unauthenticated state gracefully", async () => {
		// Arrange
		const context = buildContextForTest();

		// Act
		await proxy.call(context);

		// Assert
		expect(context.user).toHaveBeenCalled();
		expect(mockProxyServer).toHaveBeenCalledTimes(1);
		expect(mockProxyServer).toHaveBeenCalledWith(undefined);
	});
});
