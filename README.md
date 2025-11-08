# SpotiMe API

Backend API for [SpotiMe](https://github.com/caleblmyers/SpotiMe) - A personal Spotify listening dashboard that shows a user's top artists, tracks, and genres over time with graphs and statistics pulled from the Spotify Web API.

## Overview

This is the Express.js backend API that powers the SpotiMe frontend application. It handles Spotify OAuth authentication and provides RESTful endpoints to fetch user profile data, top tracks, top artists, albums, tracks, artists, and genres from the Spotify Web API.

## Tech Stack

- Node.js 22.x
- Express.js
- TypeScript
- Prisma
- PostgreSQL
- Axios
- dotenv
- cookie-parser
- cors

## Prerequisites

- Node.js 22.x or higher
- npm or yarn
- PostgreSQL (or Docker for local development)
- Spotify Developer Account with a registered app

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/caleblmyers/SpotiMe-API.git
cd spotime-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/spotime?schema=public"

# Spotify OAuth
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
SPOTIFY_REDIRECT_URI="http://localhost:4000/auth/callback"

# Application
BASE_APP_URL="http://localhost:5173"
PORT=4000
```

**Getting Spotify Credentials:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the Client ID and Client Secret
4. Add `http://localhost:4000/auth/callback` to your app's Redirect URIs

### 4. Set Up Database

#### Option A: Using Docker Compose (Recommended for Local Development)

```bash
docker-compose up -d
```

This will start a PostgreSQL container on port 5432 with:
- Database: `spotime`
- User: `postgres`
- Password: `password`

#### Option B: Using Existing PostgreSQL

Ensure your `DATABASE_URL` in `.env` points to your PostgreSQL instance.

### 5. Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Authentication

- `GET /auth/login-spotify` - Get Spotify OAuth authorization URL
- `GET /auth/callback` - Handle Spotify OAuth callback
- `POST /auth/refresh` - Refresh Spotify access token
- `GET /auth/me` - Get current user profile from database

### API Routes

All API routes require a Spotify access token in the `Authorization` header:
```
Authorization: Bearer <spotify_access_token>
```

- `GET /api/me` - Get user profile from Spotify
- `GET /api/top-tracks` - Get user's top tracks (query params: `time_range`, `limit`, `offset`)
- `GET /api/top-artists` - Get user's top artists (query params: `time_range`, `limit`, `offset`)
- `GET /api/albums?ids=...` - Get albums by IDs (comma-separated, max 20)
- `GET /api/artists?ids=...` - Get artists by IDs (comma-separated, max 50)
- `GET /api/tracks?ids=...` - Get tracks by IDs (comma-separated, max 50)
- `GET /api/genres` - Get available genre seeds

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Spotify API Attribution

This project uses the [Spotify Web API](https://developer.spotify.com/documentation/web-api) to fetch user listening data. 

**Important Notes:**
- All music data, including track information, artist details, album metadata, and user listening statistics, is provided by Spotify.
- This application is not affiliated with, endorsed by, or sponsored by Spotify.
- Spotify content is subject to [Spotify's Developer Terms of Service](https://developer.spotify.com/terms).
- Users must authenticate with their Spotify account to access their personal listening data.
- All Spotify trademarks, logos, and brand features are the property of Spotify AB.

**Spotify Developer Resources:**
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Developer Terms of Service](https://developer.spotify.com/terms)

