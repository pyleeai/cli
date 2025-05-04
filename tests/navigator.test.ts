import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { IWindow } from "oidc-client-ts";
import { Navigator } from "../src/navigator";
import { Window } from "../src/window";

describe("Navigator", () => {
	let mockWindow: IWindow;
	let mockWindowFactory: () => IWindow;
	let navigator: Navigator;

	beforeEach(() => {
		mockWindow = {
			navigate: mock(async ({ url }: { url: string }) => ({ url })),
			close: mock(() => {}),
		};
		mockWindowFactory = mock(() => mockWindow);
		navigator = new Navigator(mockWindowFactory);
	});

	test("constructor initializes with default window factory", () => {
		// Arrange & Act
		const defaultNavigator = new Navigator();

		// Assert
		expect(defaultNavigator).toBeInstanceOf(Navigator);
	});

	test("constructor accepts custom window factory", () => {
		// Arrange & Act
		const navigatorInstance = navigator;

		// Assert
		expect(navigatorInstance).toBeInstanceOf(Navigator);
	});

	test("prepare calls the window factory", async () => {
		// Arrange
		const expectedCallCount = 1;

		// Act
		const window = await navigator.prepare();

		// Assert
		expect(mockWindowFactory).toHaveBeenCalledTimes(expectedCallCount);
		expect(window).toBe(mockWindow);
	});

	test("prepare returns an object with navigate and close methods", async () => {
		// Arrange

		// Act
		const window = await navigator.prepare();

		// Assert
		expect(window).toBeDefined();
		expect(window.navigate).toBeDefined();
		expect(window.close).toBeDefined();
	});

	test("window.navigate is called with correct URL", async () => {
		// Arrange
		const window = await navigator.prepare();
		const mockUrl = "https://example.com/auth";

		// Act
		await window.navigate({ url: mockUrl });

		// Assert
		expect(window.navigate).toHaveBeenCalledWith({ url: mockUrl });
	});

	test("callback method returns a Promise that resolves", async () => {
		// Arrange

		// Act & Assert
		await expect(navigator.callback()).resolves.toBeUndefined();
	});

	test("callback method can be called multiple times", async () => {
		// Arrange
		const callCount = 3;

		// Act & Assert
		for (let i = 0; i < callCount; i++) {
			await expect(navigator.callback()).resolves.toBeUndefined();
		}
	});

	test("prepare returns the same type of window from factory", async () => {
		// Arrange
		const realWindow = new Window(async () => {});
		const windowFactory = () => realWindow;
		const realNavigator = new Navigator(windowFactory);

		// Act
		const window = await realNavigator.prepare();

		// Assert
		expect(window).toBe(realWindow);
	});

	test("implements INavigator interface", () => {
		// Arrange

		// Act & Assert
		expect(typeof navigator.prepare).toBe("function");
		expect(typeof navigator.callback).toBe("function");
	});

	test("default window factory creates a Window instance", async () => {
		// Arrange
		const defaultNavigator = new Navigator();

		// Act
		const window = await defaultNavigator.prepare();

		// Assert
		expect(window).toBeDefined();
		expect(typeof window.navigate).toBe("function");
		expect(typeof window.close).toBe("function");
	});
});
