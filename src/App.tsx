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

function App() {
	const [user, setUser] = useState<SpotifyUser | null>(null);
	const [isAuth, setIsAuth] = useState(false);

	const [playlistUrl, setPlaylistUrl] = useState('');

	const [customName, setCustomName] = useState('');
	const [customDescription, setCustomDescription] = useState('');

	const [isLoading, setIsLoading] = useState(false);

	const [authCallbackInProgress, setAuthCallbackInProgress] = useState(false);

	const [initialAuthLoading, setInitialAuthLoading] = useState(true);

	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'loading' | null;
		message: string;
	}>({ type: null, message: '' });

	useEffect(() => {
		// Clear any status from previous renders or navigation
		setStatus({ type: null, message: '' });

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
				console.error('Error during initial auth processing:', error);
			} finally {
				setInitialAuthLoading(false);
			}
		};

		processAuth();
	}, []); // Runs once on mount

	const loadUserProfile = async () => {
		if (authCallbackInProgress || window.location.search.includes('code='))
			return;

		try {
			setIsLoading(true);

			const userProfile = await getCurrentUser();

			setUser(userProfile);

			setIsAuth(true);
		} catch (error) {
			setStatus({
				type: 'error',
				message: 'Failed to load user profile. Please try logging in again.',
			});

			logout();
		} finally {
			setIsLoading(false);
		}
	};

	const handleAuthCallback = async (code: string) => {
		try {
			setIsLoading(true);

			setStatus({ type: 'loading', message: 'Authenticating with Spotify...' });

			await exchangeCodeForToken(code);

			const userProfile = await getCurrentUser();

			setUser(userProfile);
			setIsAuth(true);

			window.history.replaceState({}, document.title, window.location.pathname);

			setStatus({
				type: 'success',
				message: 'Successfully authenticated with Spotify!',
			});

			setTimeout(() => setStatus({ type: null, message: '' }), 3000);
		} catch (error) {
			setStatus({
				type: 'error',
				message: 'Authentication failed. Please try again.',
			});

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

		setStatus({ type: null, message: '' });

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

			toast.success(
				`Successfully created "${newPlaylist.name}"! Check your Spotify library.`,
				{
					id: 'duplicate-playlist',
				}
			);

			setPlaylistUrl('');
			setCustomName('');
			setCustomDescription('');

			setTimeout(() => setStatus({ type: null, message: '' }), 5000);
		} catch (error: any) {
			toast.error(
				error.message ||
					'Failed to duplicate playlist. Please check the URL and try again.',
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
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4'>
				<div className='w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin'></div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
			{/* Header */}
			<header className='bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-20 gap-3 sm:gap-0'>
						<div className='flex items-center space-x-4'>
							<div className='w-10 h-10 bg-gradient-to-br from-spotify-green to-spotify-green-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg'>
								<svg
									className='w-6 h-6 text-white'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' />
								</svg>
							</div>

							<div className='flex flex-col'>
								<h1 className='text-xl sm:text-2xl font-bold text-gray-900 leading-tight'>
									Playlist Duplicator
								</h1>

								<p className='text-xs sm:text-sm text-gray-500 font-medium'>
									Powered by Spotify
								</p>
							</div>
						</div>

						{isAuth && user && (
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto'>
								<div className='flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 user-profile-card'>
									{user.images && user.images[0] ? (
										<img
											src={user.images[0].url}
											alt={user.display_name}
											className='w-8 h-8 rounded-full object-cover'
										/>
									) : (
										<div className='w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center'>
											<span className='text-white text-sm font-semibold'>
												{user.display_name?.charAt(0).toUpperCase() || 'U'}
											</span>
										</div>
									)}

									<div className='flex flex-col min-w-0'>
										<span className='text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]'>
											{user.display_name}
										</span>

										<span className='text-xs text-gray-500'>
											{user.followers?.total
												? `${user.followers.total.toLocaleString()} follower${
														user.followers.total === 1 ? '' : 's'
												  }`
												: 'Spotify User'}
										</span>
									</div>
								</div>

								<button
									className='button-ghost text-sm px-4 py-2 h-10 self-start sm:self-auto border border-gray-200 hover:border-gray-300 transition-colors'
									onClick={handleLogout}
									disabled={isLoading}
								>
									<svg
										className='w-4 h-4 mr-2'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
										/>
									</svg>
									Logout
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12'>
				{!isAuth ? (
					<div className='text-center'>
						<div className='max-w-md mx-auto'>
							<div className='w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center mx-auto mb-6'>
								<svg
									className='w-8 h-8 text-white'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' />
								</svg>
							</div>

							<h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
								Duplicate Spotify Playlists
							</h2>

							<p className='text-base sm:text-lg text-gray-600 mb-8 leading-relaxed'>
								Connect your Spotify account to start duplicating any public
								playlist to your library
							</p>

							<button
								className='button-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto'
								onClick={handleLogin}
								disabled={isLoading}
							>
								<svg
									className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' />
								</svg>

								{isLoading ? 'Connecting...' : 'Connect with Spotify'}
							</button>
						</div>
					</div>
				) : (
					<div className='space-y-6 sm:space-y-8'>
						{/* Hero Section */}
						<div className='text-center'>
							<h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4'>
								Duplicate Playlist
							</h2>

							<p className='text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed'>
								Enter any public Spotify playlist URL below and we'll create a
								copy in your library
							</p>
						</div>

						{/* Form Section */}
						<div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8'>
							<form
								onSubmit={handleDuplicatePlaylist}
								className='space-y-4 sm:space-y-6'
							>
								<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
									<div className='form-group'>
										<label
											htmlFor='playlist-url'
											className='label text-sm sm:text-base'
										>
											Spotify Playlist URL
										</label>

										<input
											id='playlist-url'
											type='url'
											className='input h-12 sm:h-14 text-sm sm:text-base'
											placeholder='https://open.spotify.com/playlist/...'
											value={playlistUrl}
											onChange={(e) => setPlaylistUrl(e.target.value)}
											disabled={isLoading}
											required
										/>
									</div>

									<div className='form-group'>
										<label
											htmlFor='custom-name'
											className='label text-sm sm:text-base'
										>
											Custom Playlist Name (Optional)
										</label>

										<input
											id='custom-name'
											type='text'
											className='input h-12 sm:h-14 text-sm sm:text-base'
											placeholder='Leave empty to use original name'
											value={customName}
											onChange={(e) => setCustomName(e.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>

								<div className='form-group'>
									<label
										htmlFor='custom-description'
										className='label text-sm sm:text-base'
									>
										Custom Playlist Description (Optional)
									</label>

									<textarea
										id='custom-description'
										className='input text-sm sm:text-base resize-none h-24 sm:h-28'
										placeholder='Enter a description for your new playlist...'
										value={customDescription}
										onChange={(e) => setCustomDescription(e.target.value)}
										disabled={isLoading}
									/>
								</div>

								<div className='flex justify-center pt-2 sm:pt-4'>
									<button
										type='submit'
										className='button-primary text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 h-auto w-full sm:w-auto'
										disabled={isLoading || !playlistUrl.trim()}
									>
										{isLoading ? 'Duplicating...' : 'Duplicate Playlist'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Status Messages */}
				{status.type && (
					<div
						className={`mt-6 sm:mt-8 alert-${status.type} text-center text-sm sm:text-base p-4 sm:p-6 rounded-xl`}
					>
						{status.message}
					</div>
				)}
			</main>
		</div>
	);
}

export default App;
