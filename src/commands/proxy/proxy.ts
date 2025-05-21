import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import type { LocalContext } from "../../types";

export default async function (this: LocalContext): Promise<void> {
	const user = await this.user();
	const idToken = user?.id_token;
	const headers = { Authorization: `Bearer ${idToken}` };
	const configurationUrl = user?.profile?.private_metadata?.configurationUrl;

	using proxy = await MCPProxyServer(configurationUrl, { headers });
}
