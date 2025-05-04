import { buildApplication, buildRouteMap } from "@stricli/core";
import {
	buildInstallCommand,
	buildUninstallCommand,
} from "@stricli/auto-complete";
import { version, description } from "../package.json";
import { setupCommand } from "./commands/setup/command";
import { authRoutes } from "./commands/auth/commands";
import { proxyCommand } from "./commands/proxy/command";

const routes = buildRouteMap({
	routes: {
		auth: authRoutes,
		setup: setupCommand,
		proxy: proxyCommand,
		install: buildInstallCommand("cli", { bash: "__cli_bash_complete" }),
		uninstall: buildUninstallCommand("cli", { bash: true }),
	},
	defaultCommand: "proxy",
	docs: {
		brief: description,
		hideRoute: {
			install: true,
			uninstall: true,
		},
	},
});

export const app = buildApplication(routes, {
	name: projectName,
	versionInfo: {
		currentVersion: version,
	},
});
