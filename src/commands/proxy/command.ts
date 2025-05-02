import { buildCommand } from "@stricli/core";
import proxy from "./proxy";

export const proxyCommand = buildCommand({
	func: proxy,
	parameters: {
		positional: {
			kind: "tuple",
			parameters: [],
		},
	},
	docs: {
		brief: "Run the MCP proxy server",
	},
});
