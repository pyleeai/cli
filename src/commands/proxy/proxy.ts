import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import { ExitCode, type LocalContext } from "../../types.ts";

export default async function (this: LocalContext): Promise<void> {
	let user = await this.user();

	if (!user) {
		this.process.stdout.write("Signing in...\n");

		try {
			user = await this.signIn();

			if (!user) {
				this.process.stderr.write("Sign in failed!\n");
				this.process.exit(ExitCode.FAILURE);
				return;
			}
		} catch {
			this.process.stderr.write("Sign in errored!\n");
			this.process.exit(ExitCode.ERROR);
			return;
		}
	}

	const idToken = user.id_token;
	const headers = { Authorization: `Bearer ${idToken}` };
	const configurationUrl = user.profile?.private_metadata?.configurationUrl;

	// Set up token event handlers
	this.userManager.events.addAccessTokenExpiring(() => {
		this.process.stdout.write("Access token expiring, refreshing automatically...\n");
	});

	this.userManager.events.addAccessTokenExpired(() => {
		this.process.stderr.write("Warning: Access token expired. Authentication may fail.\n");
	});

	this.userManager.events.addSilentRenewError((error) => {
		this.process.stderr.write(`Token refresh failed: ${error.message}\n`);
		this.process.stderr.write("Consider restarting the proxy if authentication errors occur.\n");
	});

	this.userManager.events.addUserLoaded(() => {
		this.process.stdout.write("Authentication tokens refreshed successfully.\n");
	});

	// Start the proxy server
	using _proxy = await MCPProxyServer(configurationUrl, { headers });

	this.process.stdout.write("Proxy server started with automatic token refresh.\n");
}
