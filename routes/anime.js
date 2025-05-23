import express from 'express';
const router = express.Router();
import { validString, validNumber } from '../helpers.js';
import { getAnimeList, getAnimeById, getThemesById, getThemesByUsername } from '../data/anime.js';

router.route('/').get((req, res) => {
    const notConnected = !req.session.spotify || !req.session.spotify.access_token;
    res.status(200).render('home', { notConnected });
});
/*router.route('/user/:username').get(async (req, res) => {
    try {
        const username = validString(req.params.username);
        const animeList = await getThemesByUsername(username);
        res.status(200).json(animeList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.route('/anime/:animeId').get(async (req, res) => {
    try {
        const animeId = validNumber(req.params.animeId);
        const animeData = await getThemesById(animeId);
        res.status(200).json(animeData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});*/

export default router;