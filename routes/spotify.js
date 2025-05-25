import express from 'express';
const router = express.Router();
import axios from 'axios';
import { validString, validNumber } from '../helpers.js';
import dotenv from "dotenv";
import { getSongsFromList, getValidAccessToken, getSpotifyTokens, generateAnimePlaylist, updateAnimePlaylist, uploadImage, getPlaylistById } from '../data/spotify.js';
import { getThemesByUsername } from '../data/anime.js';
import multer from 'multer';

dotenv.config();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const upload = multer({ limits: { fileSize: 256 * 1024 } });

router.route('/login').get((req, res) => {
    const scope = 'playlist-modify-public playlist-modify-private ugc-image-upload';
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
router.route('/generate-playlist').post(upload.single('playlistImage'), async (req, res) => {
    try {
        let {
            username,
            statuses,
            isPublic,
            isCollaborative,
            includeOps,
            includeEds,
            playlistName,
            playlistDescription
            } = req.body;
        isPublic = (isPublic === "on");
        isCollaborative = (isCollaborative === "on")
        includeOps = includeOps === 'on';
        includeEds = includeEds === 'on';
        playlistName = playlistName === "" ? "My Anime Playlist" : playlistName;
        playlistDescription = playlistDescription === "" ? "This was created by DJ Waifu using my watchlist!" : playlistDescription;
        if (!includeOps && !includeEds) {
            return res.status(400).render('create', { error: "Please select at least one theme type." });
        }
        const selectedStatuses = Array.isArray(statuses) ? statuses : [statuses];
        const access_token = await getValidAccessToken(req);
        const songList = await getThemesByUsername(username, selectedStatuses, {includeOps, includeEds});
        const {playlistInfo, numUploaded} = await generateAnimePlaylist(access_token, req.session.userId, songList, isPublic, isCollaborative, playlistName, playlistDescription);
        if (req.file) {
            try {
                await uploadImage(access_token, playlistInfo.id, req.file.buffer);
            } catch (error) {
                // TODO: Alert the user
                console.error("Failed to upload playlist image", error);
            }
        } else { console.log("No image"); }
        
        console.log("Playlist Generated!")
        const updatedPlaylist = await getPlaylistById(access_token, playlistInfo.id);
        req.session.playlistResult = {
            playlist: updatedPlaylist,
            allSongsLen: songList.length,
            numUploaded: numUploaded
        };
        res.redirect('/spotify/result');
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).render('error', { code: "500", error: "Failed to create playlist" });
    }
});
router.route('/update-playlist').post(async (req, res) => {
    try {
        let {
            username,
            playlistLink,
            statuses,
            includeOps,
            includeEds
            } = req.body;
        includeOps = includeOps === 'on';
        includeEds = includeEds === 'on';
        if (!includeOps && !includeEds) {
            return res.status(400).render('update', { error: "Please select at least one theme type." });
        }
        const selectedStatuses = Array.isArray(statuses) ? statuses : [statuses];
        const access_token = await getValidAccessToken(req);
        const match = playlistLink.match(/playlist\/([a-zA-Z0-9]+)/);
        if (!match || !match[1]) {
            return res.status(400).render('update', { error: "Invalid playlist link." });
        }
        const songList = await getThemesByUsername(username, selectedStatuses, {includeOps, includeEds});
        const {playlistInfo, numUploaded} = await updateAnimePlaylist(access_token, req.session.userId, songList, playlistLink);
        
        console.log("Playlist Updated!")
        const updatedPlaylist = await getPlaylistById(access_token, playlistInfo.id);
        req.session.playlistResult = {
            playlist: updatedPlaylist,
            allSongsLen: songList.length,
            numUploaded: numUploaded
        };
        res.redirect('/spotify/result');
    } catch (error) {
        console.error('Error updating playlist:', error);
        res.status(500).render('error', { code: "500", error: "Failed to update playlist" });
    }
});
router.route("/result").get((req, res) => {
    const result = req.session.playlistResult;
    if (!result) {
        return res.redirect('/');
    }

    res.render('results', {
        playlist: result.playlist,
        allSongsLen: result.allSongsLen,
        addedSongsLen: result.numUploaded,
        pct: (result.numUploaded/result.allSongsLen * 100).toFixed(2)
    });
});
router.route('/logout', ).get((req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).render('error', { code: "500", error: "Could not log out" });
    }
    res.redirect('/');
  });
});
router.route('/clear').get((req, res) => {
    delete req.session.playlistResult;
    res.redirect('/');
});

export default router;