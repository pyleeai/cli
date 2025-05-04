import { MCPProxyServer } from "@pyleeai/mcp-proxy-server";
import type { LocalContext } from "../../types";

export default async function (this: LocalContext): Promise<void> {
	const user = await this.user();

	const configurationUrl = user?.profile?.private_metadata
		?.configurationUrl as string;

	using proxy = await MCPProxyServer(configurationUrl);
}
