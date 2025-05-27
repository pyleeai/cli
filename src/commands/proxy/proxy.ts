import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import { PYLEE_CONFIGURATION_URL } from "../../env.ts";
import { ExitCode, type LocalContext } from "../../types.ts";

export default async function (this: LocalContext): Promise<void> {
	let currentProxy: Disposable | null = null;

	const auth = async () => {
		const user = (await this.user()) || (await this.signIn());
		if (!user) throw new Error("Sign in failed!");
		return user;
	};

	const createProxy = async () => {
		const user = await auth();
		const headers = { Authorization: `Bearer ${user.id_token}` };
		const configurationUrl = PYLEE_CONFIGURATION_URL;
		const newProxy = await MCPProxyServer(configurationUrl, { headers });
		using oldProxy = currentProxy;
		currentProxy = newProxy;
	};

	const proxy = () =>
		createProxy().catch(() =>
			this.signOut()
				.then(createProxy)
				.catch((error) => failure(error.message)),
		);

	const cleanup = () => {
		using oldProxy = currentProxy;
	};

	const success = () => {
		cleanup();
		this.process.exit(ExitCode.SUCCESS);
	};

	const failure = (message: string) => {
		cleanup();
		this.process.stderr.write(`${message}\n`);
		this.process.exit(ExitCode.FAILURE);
	};

	this.userManager.events.addAccessTokenExpiring(proxy);
	this.userManager.events.addAccessTokenExpired(proxy);
	this.userManager.events.addSilentRenewError(proxy);
	this.process.on("unhandledRejection", proxy);
	this.process.on("SIGINT", success);
	this.process.on("SIGTERM", success);
	this.process.on("exit", success);

	await proxy();
}
