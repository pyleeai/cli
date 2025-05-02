import { buildCommand } from "@stricli/core";
import setup from "./setup";

export const setupCommand = buildCommand({
	func: setup,
	parameters: {
		positional: {
			kind: "tuple",
			parameters: [],
		},
	},
	docs: {
		brief: "Setup MCP proxy configuration",
	},
});
