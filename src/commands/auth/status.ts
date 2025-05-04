import type { LocalContext } from "../../types";
import { ExitCode } from "../../types";

export async function status(this: LocalContext): Promise<void> {
	const user = await this.user();

	if (user) {
		this.process.stdout.write(`Signed in as ${user.profile.email}\n`);
		this.process.exit(ExitCode.SUCCESS);
	} else {
		this.process.stdout.write("Not Signed In\n");
		this.process.stdout.write("Run 'pylee auth signin' to authenticate.\n");
		this.process.exit(ExitCode.UNAUTHORIZED);
	}
}
