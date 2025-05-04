import {
	buildInstallCommand,
	buildUninstallCommand,
} from "@stricli/auto-complete";
import { buildApplication, buildRouteMap } from "@stricli/core";
import { description, version } from "../package.json";
import { projectName } from "../package.json" assert { type: "json" };
import { authRoutes } from "./commands/auth/commands";
import { proxyCommand } from "./commands/proxy/command";
import { setupCommand } from "./commands/setup/command";

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
			setup: true,
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
