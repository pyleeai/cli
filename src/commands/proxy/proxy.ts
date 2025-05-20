import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import type { LocalContext } from "../../types";

export default async function (this: LocalContext): Promise<void> {
	const user = await this.user();
	const accessToken = user?.access_token;
	const headers = { Authorization: `Bearer ${accessToken}` };
	const configurationUrl = user?.profile?.private_metadata?.configurationUrl;

	using proxy = await MCPProxyServer(configurationUrl, { headers });
}
