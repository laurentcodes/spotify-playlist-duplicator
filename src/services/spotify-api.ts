import axios from 'axios';
import { SpotifyUser, SpotifyPlaylist, SpotifyTrack } from '../types/types';
import { getCookie, setCookie, clearCookie } from '../utils/cookies.ts';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
	import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000';

const SCOPES = [
	'user-read-private',
	'playlist-modify-public',
	'playlist-modify-private',
].join(' ');

// helper function to get access token
const getAccessToken = (): string | null => {
	return getCookie('pld_access');
};

// helper function to set access token
const setAccessToken = (token: string): void => {
	// Set cookie to expire in 1 hour (3600 seconds)
	setCookie('pld_access', token, 3600);
};

// generate spotify authorization url
export const getAuthUrl = (): string => {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		response_type: 'code',
		redirect_uri: REDIRECT_URI,
		scope: SCOPES,
		show_dialog: 'true',
	});

	const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

	return authUrl;
};

// exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<void> => {
	try {
		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: REDIRECT_URI,
				client_id: CLIENT_ID,
				client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		const accessToken = response.data.access_token;

		if (!accessToken) {
			throw new Error('No access token received from Spotify');
		}

		setAccessToken(accessToken);
	} catch (error) {
		throw new Error('Failed to authenticate with Spotify');
	}
};

// set access token manually
export const setSpotifyAccessToken = (token: string): void => {
	setAccessToken(token);
};

// get current user profile
export const getCurrentUser = async (): Promise<SpotifyUser> => {
	const accessToken = getAccessToken();

	if (!accessToken) {
		throw new Error('No access token available');
	}

	try {
		const response = await axios.get('https://api.spotify.com/v1/me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		return response.data;
	} catch (error) {
		throw new Error('Failed to fetch user profile');
	}
};

// Extract playlist ID from Spotify URL
export const extractPlaylistId = (url: string): string => {
	const regex = /playlist\/([a-zA-Z0-9]+)/;
	const match = url.match(regex);

	if (!match) {
		throw new Error('Invalid Spotify playlist URL');
	}

	return match[1];
};

// Get playlist details
export const getPlaylist = async (
	playlistId: string
): Promise<SpotifyPlaylist> => {
	const accessToken = getAccessToken();

	if (!accessToken) {
		throw new Error('No access token available');
	}

	try {
		const response = await axios.get(
			`https://api.spotify.com/v1/playlists/${playlistId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		return response.data;
	} catch (error) {
		throw new Error(
			'Failed to fetch playlist. Make sure the playlist is public or you have access to it.'
		);
	}
};

// Get all tracks from a playlist (handles pagination)
export const getPlaylistTracks = async (
	playlistId: string
): Promise<SpotifyTrack[]> => {
	const accessToken = getAccessToken();

	if (!accessToken) {
		throw new Error('No access token available');
	}

	const tracks: SpotifyTrack[] = [];

	let offset = 0;
	const limit = 100;

	try {
		while (true) {
			const response = await axios.get(
				`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
					params: {
						offset,
						limit,
						fields:
							'items(track(id,name,artists,album,uri,external_urls)),next',
					},
				}
			);

			const items = response.data.items;

			tracks.push(
				...items
					.map((item: any) => item.track)
					.filter((track: any) => track && track.id)
			);

			if (!response.data.next) {
				break;
			}

			offset += limit;
		}

		return tracks;
	} catch (error) {
		throw new Error('Failed to fetch playlist tracks');
	}
};

// create a new playlist
export const createPlaylist = async (
	userId: string,
	name: string,
	description: string
): Promise<SpotifyPlaylist> => {
	const accessToken = getAccessToken();
	if (!accessToken) {
		throw new Error('No access token available');
	}

	try {
		const response = await axios.post(
			`https://api.spotify.com/v1/users/${userId}/playlists`,
			{
				name,
				description,
				public: false,
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		return response.data;
	} catch (error) {
		throw new Error('Failed to create playlist');
	}
};

// add tracks to playlist (handles batching)
export const addTracksToPlaylist = async (
	playlistId: string,
	trackUris: string[]
): Promise<void> => {
	const accessToken = getAccessToken();
	if (!accessToken) {
		throw new Error('No access token available');
	}

	// spotify api allows max 100 tracks per request
	const batchSize = 100;

	try {
		for (let i = 0; i < trackUris.length; i += batchSize) {
			const batch = trackUris.slice(i, i + batchSize);

			await axios.post(
				`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
				{
					uris: batch,
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			);
		}
	} catch (error) {
		throw new Error('Failed to add tracks to playlist');
	}
};

// Duplicate a playlist
export const duplicatePlaylist = async (
	sourcePlaylistUrl: string,
	newPlaylistName?: string,
	newPlaylistDescription?: string
): Promise<SpotifyPlaylist> => {
	try {
		// extract playlist ID from URL
		const playlistId = extractPlaylistId(sourcePlaylistUrl);

		// get source playlist details
		const sourcePlaylist = await getPlaylist(playlistId);

		// get all tracks from source playlist
		const tracks = await getPlaylistTracks(playlistId);

		// get current user
		const user = await getCurrentUser();

		// create new playlist
		const playlistName = newPlaylistName || `${sourcePlaylist.name}`;

		const descriptionForNewPlaylist =
			newPlaylistDescription || `Duplicated from: ${sourcePlaylist.name}`;

		const newPlaylist = await createPlaylist(
			user.id,
			playlistName,
			descriptionForNewPlaylist
		);

		// add tracks to new playlist
		if (tracks.length > 0) {
			const trackUris = tracks.map((track) => track.uri);

			await addTracksToPlaylist(newPlaylist.id, trackUris);
		}

		return newPlaylist;
	} catch (error) {
		throw error;
	}
};

// Logout
export const logout = (): void => {
	clearCookie('pld_access');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
	const token = getAccessToken();

	return !!token;
};
