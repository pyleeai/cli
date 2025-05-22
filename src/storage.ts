import Conf from "conf";
import type { AsyncStorage } from "oidc-client-ts";
import pkg from "../package.json" with { type: "json" };

const { projectName } = pkg;

export class ConfAsyncStorage implements AsyncStorage {
	private conf: Conf;

	constructor() {
		this.conf = new Conf({
			projectName,
			projectSuffix: "",
			clearInvalidConfig: true,
		});
	}

	getStorageKeys(): string[] {
		return Object.keys(this.conf.store);
	}

	get length(): Promise<number> {
		return Promise.resolve(this.getStorageKeys().length);
	}

	async clear(): Promise<void> {
		this.conf.clear();
	}

	async getItem(key: string): Promise<string | null> {
		const value = this.conf.get(key);
		return value == null ? null : String(value);
	}

	async key(index: number): Promise<string | null> {
		return this.getStorageKeys()[index] ?? null;
	}

	async removeItem(key: string): Promise<void> {
		this.conf.delete(key);
	}

	async setItem(key: string, value: string): Promise<void> {
		this.conf.set(key, value);
	}
}
