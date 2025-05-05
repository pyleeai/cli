import { AUTHORITY, CLIENT_ID, REDIRECT_URI } from "./env";
import { UserStore } from "./store";

const userStore = new UserStore();

export const settings = {
	authority: AUTHORITY,
	client_id: CLIENT_ID,
	redirect_uri: REDIRECT_URI,
	response_type: "code",
	scope: "openid profile email public_metadata private_metadata",
	loadUserInfo: true,
	userStore,
};
