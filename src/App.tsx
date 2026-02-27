import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// spotify api
import {
	getCurrentUser,
	isAuthenticated,
	exchangeCodeForToken,
	getAuthUrl,
	logout,
	duplicatePlaylist,
} from './services/spotify-api';

import type { SpotifyUser } from './types/types';

const SpotifyIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
	<svg width={size} height={size} viewBox='0 0 24 24' fill={color} aria-hidden='true'>
		<path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' />
	</svg>
);

const LogOutIcon = () => (
	<svg
		width='13'
		height='13'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'
		aria-hidden='true'
	>
		<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
		<polyline points='16 17 21 12 16 7' />
		<line x1='21' y1='12' x2='9' y2='12' />
	</svg>
);

function App() {
	const [user, setUser] = useState<SpotifyUser | null>(null);
	const [isAuth, setIsAuth] = useState(false);

	const [playlistUrl, setPlaylistUrl] = useState('');

	const [customName, setCustomName] = useState('');
	const [customDescription, setCustomDescription] = useState('');

	const [isLoading, setIsLoading] = useState(false);

	const [authCallbackInProgress, setAuthCallbackInProgress] = useState(false);

	const [initialAuthLoading, setInitialAuthLoading] = useState(true);

	useEffect(() => {

		const processAuth = async () => {
			try {
				const urlParams = new URLSearchParams(window.location.search);

				const code = urlParams.get('code');

				if (code && !authCallbackInProgress) {
					setAuthCallbackInProgress(true);

					await handleAuthCallback(code);
				} else if (!code && isAuthenticated()) {
					await loadUserProfile();
				}
			} catch (error) {
				console.error('error during initial auth processing:', error);
			} finally {
				setInitialAuthLoading(false);
			}
		};

		processAuth();
	}, []);

	const loadUserProfile = async () => {
		if (authCallbackInProgress || window.location.search.includes('code=')) return;

		try {
			setIsLoading(true);

			const userProfile = await getCurrentUser();

			setUser(userProfile);

			setIsAuth(true);
		} catch (error) {
			toast.error('Failed to load user profile. Please try logging in again.');

			logout();
		} finally {
			setIsLoading(false);
		}
	};

	const handleAuthCallback = async (code: string) => {
		try {
			setIsLoading(true);

			await exchangeCodeForToken(code);

			const userProfile = await getCurrentUser();

			setUser(userProfile);
			setIsAuth(true);

			window.history.replaceState({}, document.title, window.location.pathname);

			toast.success('Successfully connected with Spotify!');
		} catch (error) {
			toast.error('Authentication failed. Please try again.');

			logout();
		} finally {
			setIsLoading(false);
			setAuthCallbackInProgress(false);
		}
	};

	const handleLogin = () => {
		const authUrl = getAuthUrl();
		window.location.href = authUrl;
	};

	const handleLogout = () => {
		logout();

		setUser(null);
		setIsAuth(false);

		setPlaylistUrl('');

		setCustomName('');
		setCustomDescription('');

		toast.dismiss('duplicate-playlist');
	};

	const handleDuplicatePlaylist = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!playlistUrl.trim()) {
			toast.error('Please enter a Spotify playlist URL');

			return;
		}

		try {
			setIsLoading(true);

			toast.loading('Duplicating playlist...', {
				id: 'duplicate-playlist',
			});

			const newPlaylist = await duplicatePlaylist(
				playlistUrl.trim(),
				customName.trim() || undefined,
				customDescription.trim() || undefined
			);

			toast.success(`Successfully created "${newPlaylist.name}"! Check your Spotify library.`, {
				id: 'duplicate-playlist',
			});

			setPlaylistUrl('');
			setCustomName('');
			setCustomDescription('');
		} catch (error: any) {
			toast.error(
				error.message || 'Failed to duplicate playlist. Please check the URL and try again.',
				{
					id: 'duplicate-playlist',
				}
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (initialAuthLoading) {
		return (
			<div className='loading-screen'>
				<div className='spinner' />
			</div>
		);
	}

	return (
		<>
			{!isAuth ? (
				<div className='hero-page'>
					<div className='blob blob-1' />
					<div className='blob blob-2' />

					<div className='hero-inner'>
						<div className='brand-badge'>
							<SpotifyIcon size={12} color='#1db954' />
							Playlist Duplicator
						</div>

						<h1 className='hero-title'>
							Copy any
							<br />
							<span className='green'>playlist</span>
						</h1>

						<p className='hero-desc'>
							Connect your Spotify account and instantly duplicate any public playlist
							into your library — with a custom name if you like.
						</p>

						<button className='btn-primary' onClick={handleLogin} disabled={isLoading}>
							<SpotifyIcon size={18} color='#000' />
							{isLoading ? 'Connecting...' : 'Connect with Spotify'}
						</button>

						<div className='feature-pills'>
							<span className='pill'>
								<span className='pill-dot' />
								Instant copy
							</span>

							<span className='pill'>
								<span className='pill-dot' />
								Custom naming
							</span>

							<span className='pill'>
								<span className='pill-dot' />
								Public playlists
							</span>
						</div>
					</div>
				</div>
			) : (
				<div className='app-shell'>
					<div className='blob blob-1' />
					<div className='blob blob-2' />

					<header className='app-header'>
						<div className='header-inner'>
							<div className='header-brand'>
								<div className='header-logo-mark'>
									<SpotifyIcon size={16} color='#000' />
								</div>

								<span className='header-title'>Duplicator</span>
							</div>

							{user && (
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
									<div className='user-chip'>
										{user.images?.[0] ? (
											<img
												src={user.images[0].url}
												alt={user.display_name}
												className='user-avatar'
											/>
										) : (
											<div className='user-avatar-fallback'>
												{user.display_name?.charAt(0).toUpperCase() || 'U'}
											</div>
										)}

										<span className='user-chip-name'>{user.display_name}</span>
									</div>

									<button
										className='btn-ghost'
										onClick={handleLogout}
										disabled={isLoading}
										aria-label='Logout'
									>
										<LogOutIcon />
										<span>Logout</span>
									</button>
								</div>
							)}
						</div>
					</header>

					<main className='app-main'>
						<p className='page-eyebrow'>Spotify Tools</p>

						<h2 className='page-heading'>
							Duplicate
							<br />a Playlist
						</h2>

						<p className='page-subtext'>
							Paste any public Spotify playlist URL below. We'll create an exact copy
							in your library.
						</p>

						<div className='form-card'>
							<form onSubmit={handleDuplicatePlaylist}>
								<div className='form-grid'>
									<div className='field-group'>
										<label htmlFor='playlist-url' className='field-label'>
											Playlist URL
										</label>

										<input
											id='playlist-url'
											type='url'
											className='field-input'
											placeholder='https://open.spotify.com/playlist/...'
											value={playlistUrl}
											onChange={(e) => setPlaylistUrl(e.target.value)}
											disabled={isLoading}
											required
										/>
									</div>

									<div className='field-group'>
										<label htmlFor='custom-name' className='field-label'>
											Custom Name{' '}
											<span style={{ opacity: 0.5, textTransform: 'none' }}>
												(optional)
											</span>
										</label>

										<input
											id='custom-name'
											type='text'
											className='field-input'
											placeholder='Leave empty to keep original'
											value={customName}
											onChange={(e) => setCustomName(e.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>

								<div className='field-group' style={{ marginTop: '1.25rem' }}>
									<label htmlFor='custom-description' className='field-label'>
										Description{' '}
										<span style={{ opacity: 0.5, textTransform: 'none' }}>
											(optional)
										</span>
									</label>

									<textarea
										id='custom-description'
										className='field-input'
										style={{ resize: 'none', minHeight: '100px' }}
										placeholder='Enter a description for your new playlist...'
										value={customDescription}
										onChange={(e) => setCustomDescription(e.target.value)}
										disabled={isLoading}
									/>
								</div>

								<div className='form-footer'>
									<button
										type='submit'
										className='btn-primary'
										disabled={isLoading || !playlistUrl.trim()}
									>
										{isLoading ? 'Duplicating...' : 'Duplicate Playlist'}
									</button>
								</div>
							</form>
						</div>
					</main>
				</div>
			)}
		</>
	);
}

export default App;
