import { WebStorageStateStore } from "oidc-client-ts";
import { ConfAsyncStorage } from "./storage";

export class UserStore extends WebStorageStateStore {
	private readonly storage: ConfAsyncStorage;

	constructor() {
		const storage = new ConfAsyncStorage();
		super({ prefix: "", store: storage });
		this.storage = storage;
	}

	override async set(key: string, value: unknown): Promise<void> {
		return await super.set(
			key,
			typeof value === "string" ? value : JSON.stringify(value),
		);
	}

	override async remove(key: string): Promise<string | null> {
		const value = await this.get(key);
		await super.remove(key);
		return value;
	}

	override async getAllKeys(): Promise<string[]> {
		return await this.storage.getStorageKeys();
	}
}
