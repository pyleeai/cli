import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import { ExitCode, type LocalContext } from "../../types.ts";

export default async function (this: LocalContext): Promise<void> {
	let currentProxy: Disposable | null = null;

	const startProxy = async () => {
		let user = await this.user();

		if (!user) {
			this.process.stdout.write("Signing in...\n");

			try {
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

		const idToken = user.id_token;
		const headers = { Authorization: `Bearer ${idToken}` };
		const configurationUrl = user.profile?.private_metadata?.configurationUrl;

		return await MCPProxyServer(configurationUrl, { headers });
	};

	const restartProxy = async () => {
		try {
			if (currentProxy) {
				currentProxy[Symbol.dispose]();
				this.process.stdout.write("Restarting proxy with refreshed tokens...\n");
			}

			currentProxy = await startProxy();
			if (!currentProxy) return;

			if (!currentProxy) {
				this.process.stdout.write("Proxy server started successfully.\n");
			}
		} catch (error) {
			this.process.stderr.write(`Failed to restart proxy: ${error}\n`);
		}
	};

	// Set up token event handlers for real-time feedback
	this.userManager.events.addAccessTokenExpiring(async () => {
		this.process.stdout.write("Access token expiring, refreshing and restarting proxy...\n");
		await restartProxy();
	});

	this.userManager.events.addAccessTokenExpired(async () => {
		this.process.stderr.write("Warning: Access token expired. Restarting proxy...\n");
		await restartProxy();
	});

	this.userManager.events.addSilentRenewError(async (error) => {
		this.process.stderr.write(`Token refresh failed: ${error.message}\n`);
		this.process.stderr.write("Attempting to restart proxy anyway...\n");
		await restartProxy();
	});

	this.userManager.events.addUserLoaded(() => {
		this.process.stdout.write("Authentication tokens refreshed successfully.\n");
	});

	// Manual token check every 30 minutes (as backup for CLI environment)
	const tokenCheckInterval = setInterval(async () => {
		try {
			const currentUser = await this.userManager.getUser();
			if (!currentUser) return;

			// Check if tokens are close to expiring (within 5 minutes)
			const now = Math.floor(Date.now() / 1000);
			const accessTokenExpiry = currentUser.expires_at || 0;
			const idTokenExpiry = currentUser.profile?.exp || 0;

			if (accessTokenExpiry <= now + 300 || idTokenExpiry <= now + 300) {
				this.process.stdout.write("Tokens approaching expiration, refreshing...\n");
				await restartProxy();
			}
		} catch (error) {
			this.process.stderr.write(`Token check failed: ${error}\n`);
		}
	}, 30 * 60 * 1000); // 30 minutes

	// Handle cleanup on process termination
	const cleanup = () => {
		if (currentProxy) {
			currentProxy[Symbol.dispose]();
		}
		clearInterval(tokenCheckInterval);
	};

	// Set up signal handlers if available (not available in test environment)
	if (typeof this.process.on === 'function') {
		this.process.on('SIGINT', cleanup);
		this.process.on('SIGTERM', cleanup);
		this.process.on('exit', cleanup);
	}

	// Start the proxy for the first time
	await restartProxy();
	this.process.stdout.write("Proxy server started with automatic token refresh.\n");
}
