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

	using proxy = await MCPProxyServer(configurationUrl, { headers });
}
