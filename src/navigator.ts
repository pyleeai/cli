import type { INavigator, IWindow } from "oidc-client-ts";
import { Window } from "./window";

export class Navigator implements INavigator {
	private window: () => IWindow;

	constructor(window: () => IWindow = () => new Window()) {
		this.window = window;
	}

	public async prepare(): Promise<IWindow> {
		return this.window();
	}

	public async callback(): Promise<void> {
		return;
	}
}
