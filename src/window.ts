import type { IWindow, NavigateResponse } from "oidc-client-ts";
import open from "open";

export type OpenerFunction = (url: string) => Promise<unknown>;

export class Window implements IWindow {
	private opener: OpenerFunction;

	constructor(opener: OpenerFunction = open) {
		this.opener = opener;
	}

	public async navigate({ url }: { url: string }): Promise<NavigateResponse> {
		await this.opener(url);
		return { url };
	}

	public close(): void {}
}
