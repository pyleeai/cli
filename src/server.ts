import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	const successHTML = await readFile(
		join(__dirname, "html", "success.html"),
		"utf-8",
	);
	const errorHTML = await readFile(
		join(__dirname, "html", "error.html"),
		"utf-8",
	);

	return new Promise<Request>((resolve, reject) => {
		if (typeof Bun !== "undefined") {
			const server = Bun.serve({
				port,
				async fetch(request) {
					try {
						await signinRedirectCallback(request.url);
						resolve(request);
						return new Response(successHTML, { headers });
					} catch (error) {
						reject(error);
						return new Response(errorHTML, { headers });
					} finally {
						server.stop();
					}
				},
				error(error) {
					reject(error);
					server.stop();
				},
			});
		} else if (typeof Deno !== "undefined") {
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
				onError: (error: unknown) => {
					reject(error);
					return new Response(errorHTML, { headers });
				},
			});
		} else {
			reject(new Error("Unsupported runtime: neither Bun nor Deno detected"));
		}
	});
}
