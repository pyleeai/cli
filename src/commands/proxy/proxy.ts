import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import { PYLEE_CONFIGURATION_URL } from "../../env.ts";
import { ExitCode, type LocalContext } from "../../types.ts";

export default async function (this: LocalContext): Promise<void> {
	let currentProxy: Disposable | null = null;

	const auth = async (forceRefresh = false) => {
		let user = await this.user();

		if (!user || forceRefresh) {
			try {
				if (forceRefresh && user) {
					await this.signOut();
				}
				
				user = await this.signIn();

				if (!user) {
					this.process.stderr.write("Sign in failed!\n");
					this.process.exit(ExitCode.FAILURE);
					return null;
				}
			} catch {
				this.process.stderr.write("Sign in errored!\n");
				this.process.exit(ExitCode.ERROR);
				return null;
			}
		}

		return user;
	};

	const proxy = async (isRetry = false) => {
		try {
			const user = await auth(isRetry);

			if (!user) return;

			const idToken = user.id_token;
			const headers = { Authorization: `Bearer ${idToken}` };
			const configurationUrl = PYLEE_CONFIGURATION_URL;
			const newProxy = await MCPProxyServer(configurationUrl, { headers });

			if (currentProxy) {
				dispose(currentProxy);
			}

			currentProxy = newProxy;
		} catch (error) {
			if (isRetry) {
				this.process.stderr.write("Proxy failed after retry!\n");
				if (currentProxy) {
					this.process.stderr.write("Keeping existing proxy running.\n");
				}
				return;
			}

			this.process.stderr.write("Proxy failed, retrying with fresh authentication...\n");

			try {
				await proxy(true);
			} catch {
				this.process.stderr.write("Proxy retry failed!\n");
				if (currentProxy) {
					this.process.stderr.write("Keeping existing proxy running.\n");
				}
			}
		}
	};

	const dispose = (resource: Disposable) => {
		using _resource = resource;
	};

	const cleanup = () => {
		if (currentProxy) {
			dispose(currentProxy);
		}

		this.process.exit(ExitCode.SUCCESS);
	};

	this.userManager.events.addAccessTokenExpiring(async () => {
		await proxy();
	});

	this.userManager.events.addAccessTokenExpired(async () => {
		await proxy();
	});

	this.userManager.events.addSilentRenewError(async () => {
		await proxy();
	});

	if (typeof this.process.on === "function") {
		this.process.on("SIGINT", cleanup);
		this.process.on("SIGTERM", cleanup);
		this.process.on("exit", cleanup);
	}

	await proxy();
}
