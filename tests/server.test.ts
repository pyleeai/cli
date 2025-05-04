import { describe, expect, mock, test } from "bun:test";

describe("authServer core functionality", () => {
	interface AuthServerOptions {
		signinRedirectCallback: (url: string) => Promise<void>;
	}

	interface MockServer {
		stop: ReturnType<typeof mock>;
		unref: ReturnType<typeof mock>;
		fetch: (request: Request) => Promise<Response>;
		error: (error: unknown) => void;
	}

	type TestAuthServerType = {
		(options: AuthServerOptions): Promise<Request>;
		mockServer: MockServer | null;
	};

	const testAuthServer: TestAuthServerType = ((
		options: AuthServerOptions,
	): Promise<Request> =>
		new Promise<Request>((resolve, reject) => {
			const server: Partial<MockServer> = {
				stop: mock(() => {}),
				unref: mock(() => {}),
			};
			async function fetchHandler(request: Request): Promise<Response> {
				try {
					await options.signinRedirectCallback(request.url);
					resolve(request);
					return new Response("Success", {
						headers: { "Content-Type": "text/html" },
					});
				} catch (error) {
					reject(error);
					return new Response("Error", {
						headers: { "Content-Type": "text/html" },
					});
				} finally {
					server.stop?.();
				}
			}
			function errorHandler(error: unknown): void {
				reject(error);
				server.stop?.();
			}
			(server as MockServer).fetch = fetchHandler;
			(server as MockServer).error = errorHandler;
			server.unref?.();
			testAuthServer.mockServer = server as MockServer;
		})) as TestAuthServerType;

	testAuthServer.mockServer = null;

	test("should resolve with request when callback succeeds", async () => {
		// Arrange
		const mockCallback = mock(async () => {});
		const serverPromise = testAuthServer({
			signinRedirectCallback: mockCallback,
		});
		const testRequest = new Request("http://localhost:3000/callback?code=123");
		if (!testAuthServer.mockServer) {
			throw new Error("mockServer is null");
		}
		const mockServer = testAuthServer.mockServer as unknown as MockServer;

		// Act
		const response = await mockServer.fetch(testRequest);
		if (!response) {
			throw new Error("Response is undefined");
		}
		const result = await serverPromise;

		// Assert
		expect(mockCallback).toHaveBeenCalledWith(testRequest.url);
		expect(response.headers.get("Content-Type")).toBe("text/html");
		expect(mockServer.stop).toHaveBeenCalled();
		expect(result).toBe(testRequest);
	});

	test("should reject with error when callback fails", async () => {
		// Arrange
		testAuthServer.mockServer = null;
		const testError = new Error("Auth failed");
		const mockCallback = mock(async () => {
			throw testError;
		});
		const serverPromise = testAuthServer({
			signinRedirectCallback: mockCallback,
		});
		const testRequest = new Request(
			"http://localhost:3000/callback?error=true",
		);
		if (!testAuthServer.mockServer) {
			throw new Error("mockServer is null");
		}
		const mockServer = testAuthServer.mockServer as unknown as MockServer;

		// Act
		const response = await mockServer.fetch(testRequest);
		if (!response) {
			throw new Error("Response is undefined");
		}

		// Assert
		expect(mockCallback).toHaveBeenCalledWith(testRequest.url);
		expect(response.headers.get("Content-Type")).toBe("text/html");
		expect(mockServer.stop).toHaveBeenCalled();
		await expect(serverPromise).rejects.toThrow(testError);
	});

	test("should reject when server has an error", async () => {
		// Arrange
		testAuthServer.mockServer = null;
		const testError = new Error("Server error");
		const mockCallback = mock(async () => {});
		const serverPromise = testAuthServer({
			signinRedirectCallback: mockCallback,
		});
		if (!testAuthServer.mockServer) {
			throw new Error("mockServer is null");
		}
		const mockServer = testAuthServer.mockServer as unknown as MockServer;

		// Act
		mockServer.error(testError);

		// Assert
		expect(mockServer.stop).toHaveBeenCalled();
		await expect(serverPromise).rejects.toThrow(testError);
	});
});
