import type { LocalContext } from "../../types";
import { ExitCode } from "../../types";

export async function signout(this: LocalContext): Promise<void> {
	const user = await this.user();

	if (user) {
		await this.signOut();
		this.process.stdout.write(`Signed out ${user.profile.email}\n`);
		this.process.exit(ExitCode.SUCCESS);
	} else {
		this.process.stdout.write("Not signed in\n");
		this.process.exit(ExitCode.UNAUTHORIZED);
	}
}
