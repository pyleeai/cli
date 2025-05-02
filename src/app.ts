import {
	buildInstallCommand,
	buildUninstallCommand,
} from "@stricli/auto-complete";
import { buildApplication, buildRouteMap } from "@stricli/core";
import { description, version } from "../package.json";

const routes = buildRouteMap({
	routes: {
		install: buildInstallCommand("cli", { bash: "__cli_bash_complete" }),
		uninstall: buildUninstallCommand("cli", { bash: true }),
	},
	docs: {
		brief: description,
		hideRoute: {
			install: true,
			uninstall: true,
		},
	},
});

export const app = buildApplication(routes, {
	name: "pylee",
	versionInfo: {
		currentVersion: version,
	},
});
