import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import Conf from "conf";
import { projectName } from "../package.json" assert { type: "json" };
import { ConfAsyncStorage } from "../src/storage";

describe("ConfAsyncStorage", () => {
	let storage: ConfAsyncStorage;
	let tempDir: string;

	beforeEach(() => {
		tempDir = path.join(process.cwd(), `.tmp-test-${Date.now()}`);
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
		storage = new ConfAsyncStorage();
		storage.clear();
	});

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("getItem returns null for non-existent keys", async () => {
		// Arrange
		const nonExistentKey = "non-existent-key";

		// Act
		const result = await storage.getItem(nonExistentKey);

		// Assert
		expect(result).toBeNull();
	});

	test("getItem returns string value for string values", async () => {
		// Arrange
		const key = "string-key";
		const value = "test-value";

		// Act
		await storage.setItem(key, value);
		const result = await storage.getItem(key);

		// Assert
		expect(result).toBe(value);
	});

	test("getItem converts non-string values to strings", async () => {
		// Arrange
		const mockStorage = new ConfAsyncStorage();
		const testKey = "number-key-test";
		// @ts-ignore - accessing private property for testing
		mockStorage.conf.set(testKey, 123);

		// Act
		const result = await mockStorage.getItem(testKey);

		// Assert
		expect(result).toBe("123");
	});

	test("setItem sets values", async () => {
		// Arrange
		const key = "key";
		const value = "value";

		// Act
		await storage.setItem(key, value);
		const storedValue = await storage.getItem(key);

		// Assert
		expect(storedValue).toBe(value);
	});

	test("removeItem deletes values", async () => {
		// Arrange
		const key = "to-remove";
		const value = "value";
		await storage.setItem(key, value);

		// Act
		await storage.removeItem(key);
		const result = await storage.getItem(key);

		// Assert
		expect(result).toBeNull();
	});

	test("clear removes all values", async () => {
		// Arrange
		await storage.setItem("key1", "value1");
		await storage.setItem("key2", "value2");

		// Act
		await storage.clear();
		const key1Value = await storage.getItem("key1");
		const key2Value = await storage.getItem("key2");
		const length = await storage.length;

		// Assert
		expect(key1Value).toBeNull();
		expect(key2Value).toBeNull();
		expect(length).toBe(0);
	});

	test("length returns correct number of keys", async () => {
		// Arrange
		await storage.clear();

		// Act & Assert
		const emptyLength = await storage.length;
		expect(emptyLength).toBe(0);

		await storage.setItem("key1", "value1");
		const oneKeyLength = await storage.length;
		expect(oneKeyLength).toBe(1);

		await storage.setItem("key2", "value2");
		const twoKeysLength = await storage.length;
		expect(twoKeysLength).toBe(2);

		await storage.removeItem("key1");
		const afterRemoveLength = await storage.length;
		expect(afterRemoveLength).toBe(1);
	});

	test("key returns key at the specified index", async () => {
		// Arrange
		await storage.clear();
		await storage.setItem("key1", "value1");
		await storage.setItem("key2", "value2");
		const keys = storage.getStorageKeys();

		// Act
		const key0 = await storage.key(0);
		const key1 = await storage.key(1);

		// Assert
		expect(key0).toBe(keys[0] ?? null);
		expect(key1).toBe(keys[1] ?? null);
	});

	test("key returns null for invalid index", async () => {
		// Arrange
		await storage.clear();
		await storage.setItem("key1", "value1");

		// Act
		const result = await storage.key(999);

		// Assert
		expect(result).toBeNull();
	});

	test("getStorageKeys returns all keys in storage", async () => {
		// Arrange
		await storage.clear();
		const keys = ["key1", "key2", "key3"];
		for (const key of keys) {
			await storage.setItem(key, `value-${key}`);
		}

		// Act
		const allKeys = storage.getStorageKeys();

		// Assert
		expect(allKeys.length).toBe(keys.length);
		expect(keys.every((k) => allKeys.includes(k))).toBe(true);
	});

	test("storage persists data between instances", async () => {
		// Arrange
		await storage.setItem("persistent-key", "persistent-value");

		// Act
		const newStorage = new ConfAsyncStorage();
		const result = await newStorage.getItem("persistent-key");

		// Assert
		expect(result).toBe("persistent-value");
	});

	test("getItem handles non-string values that are falsy but not null", async () => {
		// Arrange
		// @ts-ignore - accessing private property for testing
		storage.conf.set("zero-key", 0);

		// Act
		const result = await storage.getItem("zero-key");

		// Assert
		expect(result).toBe("0");
	});

	test("getItem returns null when value is explicitly null", async () => {
		// Arrange
		// @ts-ignore - accessing private property for testing
		storage.conf.set("null-key", null);

		// Act
		const result = await storage.getItem("null-key");

		// Assert
		expect(result).toBeNull();
	});

	test("getItem returns null when key doesn't exist", async () => {
		// Arrange
		const nonExistentKey = `nonexistent-key-${Date.now()}`;

		// Act
		const result = await storage.getItem(nonExistentKey);

		// Assert
		expect(result).toBeNull();
	});

	test("getItem handles undefined values correctly", async () => {
		// Arrange
		await storage.removeItem("undefined-value-key");

		// Act
		const result = await storage.getItem("undefined-value-key");

		// Assert
		expect(result).toBeNull();
	});

	test("getItem handles various data types correctly", async () => {
		// Arrange
		const testCases = [
			{ key: "array-key", value: [1, 2, 3], expected: "1,2,3" },
			{ key: "object-key", value: { a: 1, b: 2 }, expected: "[object Object]" },
			{ key: "boolean-true-key", value: true, expected: "true" },
			{ key: "boolean-false-key", value: false, expected: "false" },
			{ key: "number-key", value: 42, expected: "42" },
			{ key: "empty-string-key", value: "", expected: "" },
			{ key: "zero-key", value: 0, expected: "0" },
			{ key: "negative-key", value: -1, expected: "-1" },
			{ key: "float-key", value: 3.14, expected: "3.14" },
		];

		// Act & Assert
		for (const { key, value, expected } of testCases) {
			await storage.setItem(key, value.toString());
			const result = await storage.getItem(key);
			expect(result).toBe(expected);
		}
	});

	test("key method handles invalid indices correctly", async () => {
		// Arrange
		await storage.clear();
		await storage.setItem("test-key", "test-value");

		// Act & Assert
		expect(await storage.key(-1)).toBeNull();
		expect(await storage.key(999)).toBeNull();
		expect(await storage.key(0)).toBe("test-key");
	});

	test("constructor creates a Conf instance with correct config", () => {
		// Arrange
		const testStorage = new ConfAsyncStorage();
		const testKey = `constructor-test-key-${Date.now()}`;
		const testValue = "test-value";

		// Act
		testStorage.setItem(testKey, testValue);

		// Assert
		expect(testStorage.getItem(testKey)).resolves.toBe(testValue);
	});

	test("length getter uses getStorageKeys method", async () => {
		// Arrange
		await storage.clear();

		// Act & Assert
		expect(await storage.length).toBe(0);

		await storage.setItem("key1", "value1");
		await storage.setItem("key2", "value2");

		const keys = storage.getStorageKeys();
		expect(await storage.length).toBe(keys.length);
	});
});
