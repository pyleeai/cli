import { buildCommand, buildRouteMap } from "@stricli/core";
import { signin } from "./signin";
import { signout } from "./signout";
import { status } from "./status";

export const statusCommand = buildCommand({
	func: status,
	parameters: {
		positional: {
			kind: "tuple",
			parameters: [],
		},
	},
	docs: {
		brief: "Check the current authentication status",
	},
});

export const signinCommand = buildCommand({
	func: signin,
	parameters: {
		positional: {
			kind: "tuple",
			parameters: [],
		},
	},
	docs: {
		brief: "Sign in to Pylee AI",
	},
});

export const signoutCommand = buildCommand({
	func: signout,
	parameters: {
		positional: {
			kind: "tuple",
			parameters: [],
		},
	},
	docs: {
		brief: "Sign out from Pylee AI",
	},
});

export const authRoutes = buildRouteMap({
	routes: {
		status: statusCommand,
		signin: signinCommand,
		signout: signoutCommand,
	},
	docs: {
		brief: "Authentication commands",
	},
});
