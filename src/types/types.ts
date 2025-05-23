export interface SpotifyUser {
	id: string;
	display_name: string;
	email: string;
	images: Array<{
		url: string;
		height: number;
		width: number;
	}>;
	followers?: {
		total: number;
	};
}

export interface SpotifyTrack {
	id: string;
	name: string;
	artists: Array<{
		id: string;
		name: string;
	}>;
	album: {
		id: string;
		name: string;
		images: Array<{
			url: string;
			height: number;
			width: number;
		}>;
	};
	uri: string;
	external_urls: {
		spotify: string;
	};
}

export interface SpotifyPlaylist {
	id: string;
	name: string;
	description: string;
	public: boolean;
	collaborative: boolean;
	tracks: {
		total: number;
		items: Array<{
			track: SpotifyTrack;
		}>;
	};
	owner: {
		id: string;
		display_name: string;
	};
	images: Array<{
		url: string;
		height: number;
		width: number;
	}>;
	external_urls: {
		spotify: string;
	};
}

export interface AuthTokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export interface AppState {
	isAuthenticated: boolean;
	user: SpotifyUser | null;
	accessToken: string | null;
	isLoading: boolean;
	error: string | null;
	success: string | null;
}
