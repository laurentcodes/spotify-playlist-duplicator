# Spotify Playlist Duplicator

A minimalist web application that allows you to duplicate any public Spotify playlist to your personal Spotify library. Built with React, TypeScript, and the Spotify Web API.

## Features

- 🎵 Duplicate any public Spotify playlist
- 🔐 Secure OAuth authentication with Spotify
- 🎨 Beautiful, minimalist UI with Spotify-inspired design (Tailwind CSS v4)
- 📱 Responsive design that works on all devices
- ⚡ Fast and efficient playlist duplication
- 🏷️ Option to customize the new playlist name

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Spotify account
- Spotify Developer App credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd spotify-playlist-duplicator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Click "Create an App"
3. Fill in the app name and description
4. Accept the terms and create the app
5. Note down your **Client ID** and **Client Secret**
6. Click "Edit Settings"
7. Add `http://localhost:3000` to the "Redirect URIs" field
   - ⚠️ **You'll see a security warning** - this is normal for development
   - Click "Add" anyway - Spotify allows localhost for development
8. Save the settings

### 4. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your Spotify credentials:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_actual_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_actual_client_secret
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:3000
   ```

### 5. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## How to Use

1. **Connect with Spotify**: Click the "Connect with Spotify" button to authenticate
2. **Enter Playlist URL**: Paste any public Spotify playlist URL (e.g., `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`)
3. **Optional Custom Name**: Enter a custom name for the duplicated playlist (or leave empty to auto-generate)
4. **Duplicate**: Click "Duplicate Playlist" and wait for the process to complete
5. **Check Your Library**: The new playlist will appear in your Spotify library

## Supported URL Formats

The app supports various Spotify playlist URL formats:

- `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`
- `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...`
- `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`

## Technical Details

### Built With

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **Vite** - Build tool and dev server
- **Spotify Web API** - Playlist and user data
- **Axios** - HTTP client

### Key Features

- **OAuth 2.0 Flow**: Secure authentication with Spotify
- **Pagination Handling**: Efficiently handles playlists with thousands of tracks
- **Batch Processing**: Optimized track addition in batches of 100
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive Design**: Works seamlessly on desktop and mobile

### API Permissions

The app requests the following Spotify scopes:

- `user-read-private` - Read user profile
- `playlist-read-public` - Read public playlists
- `playlist-modify-public` - Create/modify public playlists
- `playlist-modify-private` - Create/modify private playlists
# spotify-playlist-duplicator
