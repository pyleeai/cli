import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { UserStore } from "../src/store";

describe("Store", () => {
	let store: UserStore;
	let tempDir: string;

	beforeEach(() => {
		tempDir = path.join(process.cwd(), `.tmp-test-${Date.now()}`);
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
		store = new UserStore();
	});

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("get returns null for non-existent keys", async () => {
		// Arrange
		const nonExistentKey = "non-existent-key";

		// Act
		const result = await store.get(nonExistentKey);

		// Assert
		expect(result).toBeNull();
	});

	test("set and get work with string values", async () => {
		// Arrange
		const key = "string-key";
		const value = "test-value";

		// Act
		await store.set(key, value);
		const result = await store.get(key);

		// Assert
		expect(result).toBe(value);
	});

	test("set and get work with object values", async () => {
		// Arrange
		const key = "object-key";
		const value = { foo: "bar", num: 123 };

		// Act
		await store.set(key, value);
		const result = await store.get(key);

		// Assert
		expect(result).toBe(JSON.stringify(value));
	});

	test("remove deletes a value and returns it", async () => {
		// Arrange
		const key = "remove-key";
		const value = "remove-value";
		await store.set(key, value);

		// Act
		const removed = await store.remove(key);
		const afterRemove = await store.get(key);

		// Assert
		expect(removed).toBe(value);
		expect(afterRemove).toBeNull();
	});

	test("getAllKeys returns all keys in the store", async () => {
		// Arrange
		const keys = ["key1", "key2", "key3"];
		for (const key of keys) {
			await store.set(key, `value-${key}`);
		}

		// Act
		const allKeys = await store.getAllKeys();

		// Assert
		expect(keys.every((k) => allKeys.includes(k))).toBe(true);
	});

	test("store persists data between instances", async () => {
		// Arrange
		const key = "persistent-key";
		const value = "persistent-value";
		await store.set(key, value);

		// Act
		const newStore = new UserStore();
		const result = await newStore.get(key);

		// Assert
		expect(result).toBe(value);
	});
});
