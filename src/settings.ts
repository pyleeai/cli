import {
	PYLEE_OIDC_AUTHORITY,
	PYLEE_OIDC_CLIENT_ID,
	PYLEE_OIDC_REDIRECT_URI,
} from "./env";
import { UserStore } from "./store";

const userStore = new UserStore();
const authority = PYLEE_OIDC_AUTHORITY;
const client_id = PYLEE_OIDC_CLIENT_ID;
const redirect_uri = PYLEE_OIDC_REDIRECT_URI;

export const settings = {
	authority,
	client_id,
	redirect_uri,
	response_type: "code",
	scope: "openid profile email public_metadata private_metadata",
	loadUserInfo: true,
	userStore,
	automaticSilentRenew: true,
	silentRequestTimeoutInSeconds: 10,
	includeIdTokenInSilentRenew: true,
	accessTokenExpiringNotificationTimeInSeconds: 300,
	checkSessionIntervalInSeconds: 300,
};
