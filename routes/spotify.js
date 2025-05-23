import express from 'express';
const router = express.Router();
import axios from 'axios';
import { validString, validNumber } from '../helpers.js';
import qs from 'qs';
import dotenv from "dotenv";
import { getSongsFromList, getValidAccessToken, getSpotifyTokens, createPlaylist } from '../data/spotify.js';
import { getThemesByUsername } from '../data/anime.js';
dotenv.config();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

router.route('/login').get((req, res) => {
    const scope = 'playlist-modify-public playlist-modify-private';
    const query = new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        redirect_uri: redirect_uri,
        scope: scope,
    });
    res.redirect(`https://accounts.spotify.com/authorize?${query.toString()}`);
});
router.route('/callback').get(async (req, res) => {
    if (!req.query.code) {
        return res.status(400).render('error', { code: "400", error: "No code provided by Spotify." });
    }
    const code = validString(req.query.code);
    try {
        const tokens = await getSpotifyTokens(code);
        //console.log("Tokens:", tokens);
        req.session.spotify = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
        };
        const myProfile = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });
        //console.log(myProfile);
        req.session.userId = myProfile.data.id;
        res.redirect('/');
    } catch (error) {
        console.error('Error fetching access token:', error);
        res.status(500).render('error', { code: "500", error: "Spotify authentication failed" });
    }
});
router.route('/generate-playlist').post(async (req, res) => {
    try {
        let { username, isPublic } = req.body;
        isPublic = (isPublic === "on");
        const access_token = await getValidAccessToken(req);
        //console.log("Access token");
        const animeList = await getThemesByUsername(username);
        //console.log("Anime list")
        const songList = await getSongsFromList(access_token, animeList);
        //console.log("Song list")
        const playlistInfo = await createPlaylist(access_token, req.session.userId, songList, isPublic);
        //console.log("Playlist")
        res.render('results', {playlist: playlistInfo})
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).render('error', { code: "500", error: "Failed to create playlist" });
    }
});
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).render('error', { code: "500", error: "Could not log out" });
    }
    res.redirect('/');
  });
});

export default router;