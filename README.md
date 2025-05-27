# 🎧 DJ Waifu 🎧
## Turn Your MyAnimeList Into a Spotify Playlist

DJ Waifu is a full-stack web application that automatically generates a Spotify playlist based on the profile data of a MyAnimeList user.

## Features
- Connect your Spotify account with OAuth to have a playlist automatically created in your account
- Update an existing playlist with your anime list
- Filter by watch status (watching, completed, on hold, dropped, and plan to watch)
- Filter by opening themes, ending themes, or both
- Add a name, description, and JPEG thumbnail too your playlist (if you want), and optionally make it collaborative
- See an embedded preview of your generated playlist in the browser, with a link directing to the full playlist on Spotify

## Tech Stack
- Backend: Node.js, Express
- Frontend: Handlebars, CSS, Vanilla JS
- Spotify API: Playlist creation and modification, track search, user authentication
- MyAnimeList API (v2): Anime list scraping and anime data parsing
- Session & Auth: express-session, OAuth2
- Image Upload: multer, Base64 JPEG upload to Spotify

## Planned Improvements
- Create joint playlists using multiple MAL accounts
- Playlist statistics
- Improve track search accuracy
- Sharing playlists
- Save playlists to an account
