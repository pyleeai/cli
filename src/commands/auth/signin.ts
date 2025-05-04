import type { LocalContext } from "../../types";
import { ExitCode } from "../../types";

export async function signin(this: LocalContext): Promise<void> {
	const user = await this.user();

	this.process.stdout.write("Signing in...\n");

	try {
		const user = await this.signIn();

		if (user) {
			this.process.stdout.write(`Signed in as ${user.profile.email}\n`);
			this.process.exit(ExitCode.SUCCESS);
		} else {
			this.process.stderr.write("Sign in failed!\n");
			this.process.exit(ExitCode.FAILURE);
		}
	} catch (error) {
		this.process.stderr.write("Sign in errored!\n");
		this.process.exit(ExitCode.ERROR);
	}
}
