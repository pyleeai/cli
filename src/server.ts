import { serve } from "bun";
import { PORT } from "./env";
import errorHTML from "./html/error.html" with { type: "text" };
import successHTML from "./html/success.html" with { type: "text" };

export interface AuthServerOptions {
	signinRedirectCallback: (url: string) => Promise<void>;
}

export function authServer({
	signinRedirectCallback,
}: AuthServerOptions): Promise<Request> {
	return new Promise<Request>((resolve, reject) => {
		const headers = { "Content-Type": "text/html" };
		const server = serve({
			port: PORT,
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
	});
}
