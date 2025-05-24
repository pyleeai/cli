import process from "node:process";

export const PYLEE_OIDC_AUTHORITY = process.env.PYLEE_OIDC_AUTHORITY;
export const PYLEE_OIDC_CLIENT_ID = process.env.PYLEE_OIDC_CLIENT_ID;
export const PYLEE_OIDC_REDIRECT_URI = process.env.PYLEE_OIDC_REDIRECT_URI;
export const PYLEE_OIDC_PORT = process.env.PYLEE_OIDC_PORT;
export const PYLEE_CONFIGURATION_URL =
	process.env.PYLEE_CONFIGURATION_URL ||
	"http://localhost:3002/active-registry";
