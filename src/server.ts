import { PYLEE_OIDC_PORT } from "./env";

export interface AuthServerSetupOptions {
	signal: AbortSignal;
	signinRedirectCallback: (url: string) => Promise<void>;
}

export async function authServer(
	options: AuthServerSetupOptions,
): Promise<Request> {
	const { signinRedirectCallback, signal } = options;
	const port = Number(PYLEE_OIDC_PORT);
	const headers = { "Content-Type": "text/html" };
	const successHTML = await Deno.readTextFile(
		new URL("./html/success.html", import.meta.url),
	);
	const errorHTML = await Deno.readTextFile(
		new URL("./html/error.html", import.meta.url),
	);

	return new Promise<Request>((resolve, reject) => {
		Deno.serve({
			port,
			hostname: "0.0.0.0",
			signal,
			handler: async (request: Request) => {
				try {
					await signinRedirectCallback(request.url);
					resolve(request);
					return new Response(successHTML, { headers });
				} catch (err) {
					reject(err);
					return new Response(errorHTML, { headers });
				}
			},
			onListen() {},
			onError: (error) => {
				reject(error);
				return new Response(errorHTML, { headers });
			},
		});
	});
}
