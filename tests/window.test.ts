import { describe, expect, mock, test } from "bun:test";
import { type OpenerFunction, Window } from "../src/window";

describe("Window", () => {
	test("constructor initializes with default opener", () => {
		// Arrange & Act
		const window = new Window();

		// Assert
		expect(window).toBeInstanceOf(Window);
	});

	test("constructor accepts custom opener function", () => {
		// Arrange
		const mockOpener: OpenerFunction = async () => {};

		// Act
		const window = new Window(mockOpener);

		// Assert
		expect(window).toBeInstanceOf(Window);
	});

	test("navigate calls opener function with correct URL", async () => {
		// Arrange
		const mockOpener = mock<OpenerFunction>((url) => Promise.resolve());
		const window = new Window(mockOpener);
		const mockUrl = "https://example.com/auth";

		// Act
		const response = await window.navigate({ url: mockUrl });

		// Assert
		expect(mockOpener).toHaveBeenCalledTimes(1);
		expect(mockOpener).toHaveBeenCalledWith(mockUrl);
		expect(response).toBeDefined();
		expect(response.url).toBe(mockUrl);
	});

	test("navigate works with different URLs", async () => {
		// Arrange
		const mockOpener = mock<OpenerFunction>((url) => Promise.resolve());
		const window = new Window(mockOpener);
		const urls = [
			"https://example.com/auth",
			"https://another-example.org/login",
			"https://test.com?param=value",
		];

		// Act & Assert
		for (const url of urls) {
			const response = await window.navigate({ url });
			expect(response.url).toBe(url);
			expect(mockOpener).toHaveBeenCalledWith(url);
		}
	});

	test("navigate Promise resolves correctly", async () => {
		// Arrange
		const mockOpener = mock<OpenerFunction>((url) => Promise.resolve());
		const window = new Window(mockOpener);
		const mockUrl = "https://example.com/auth";

		// Act & Assert
		await expect(window.navigate({ url: mockUrl })).resolves.toEqual({
			url: mockUrl,
		});
	});

	test("navigate handles errors from opener function", async () => {
		// Arrange
		const mockError = new Error("Failed to open URL");
		const mockOpener = mock<OpenerFunction>((url) => Promise.reject(mockError));
		const window = new Window(mockOpener);
		const mockUrl = "https://example.com/auth";

		// Act & Assert
		await expect(window.navigate({ url: mockUrl })).rejects.toThrow(
			"Failed to open URL",
		);
	});

	test("close method exists and can be called", () => {
		// Arrange
		const window = new Window();

		// Act & Assert
		expect(() => window.close()).not.toThrow();
	});

	test("Window class implements IWindow interface", () => {
		// Arrange
		const window = new Window();

		// Act & Assert
		expect(typeof window.navigate).toBe("function");
		expect(typeof window.close).toBe("function");
	});
});
