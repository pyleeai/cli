import { getEnv } from "./env";
import { UserStore } from "./store";

const env = getEnv();
const userStore = new UserStore();

export const settings = {
	authority: env.AUTHORITY,
	client_id: env.CLIENT_ID,
	redirect_uri: env.REDIRECT_URI,
	response_type: "code",
	scope: "openid profile email public_metadata private_metadata",
	loadUserInfo: true,
	userStore,
};
