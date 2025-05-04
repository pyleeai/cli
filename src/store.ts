import { WebStorageStateStore } from "oidc-client-ts";
import { ConfAsyncStorage } from "./storage";

export class UserStore extends WebStorageStateStore {
	private readonly storage: ConfAsyncStorage;

	constructor() {
		const storage = new ConfAsyncStorage();
		super({ prefix: "", store: storage });
		this.storage = storage;
	}

	async set(key: string, value: unknown): Promise<void> {
		return super.set(
			key,
			typeof value === "string" ? value : JSON.stringify(value),
		);
	}

	async remove(key: string): Promise<string | null> {
		const value = await this.get(key);
		await super.remove(key);
		return value;
	}

	async getAllKeys(): Promise<string[]> {
		return this.storage.getStorageKeys();
	}
}
