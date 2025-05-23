import axios from "axios";
import { validString, validNumber } from "../helpers.js";
import dotenv from "dotenv";
dotenv.config();

const client_id = process.env.MAL_CLIENT_ID;
const client_secret = process.env.MAL_CLIENT_SECRET;

export const getAnimeList = async (username, statuses) => {
    try {
        username = validString(username);
        if (!statuses || typeof statuses !== 'object' || !Array.isArray(statuses)) throw "Invalid statuses";
        const allAnime = [];
        for (let status of statuses) {
            let response = await axios.get(
            `https://api.myanimelist.net/v2/users/${username}/animelist`,
            {
                headers: {
                    "X-MAL-CLIENT-ID": client_id
                },
                params: {
                    limit: 1000,
                    status: status,
                    fields: "anime_id,list_status,anime_title",
                },
            });
            allAnime.push(...response.data.data)
        }
        
        return allAnime;
    } catch (error) {
        console.error("Error fetching anime list: ", error);
        throw error;
    }
}

export const getAnimeById = async (animeId) => {
    try {
        animeId = validNumber(animeId);
        const response = await axios.get(
            `https://api.myanimelist.net/v2/anime/${animeId}`,
            {
                headers: {
                    "X-MAL-CLIENT-ID": client_id
                },
                params: {
                    limit: 1,
                    //fields: id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics
                    fields: "opening_themes, ending_themes"
                }
            });
        return response.data;
    } catch (error) {
        console.error("Error fetching anime by id: ", error);
        throw error;
    }
}

export const getThemesById = async (animeId) => {
    try {
        animeId = validNumber(animeId);
        const anime = await getAnimeById(animeId);
        let openingThemes = [];
        let endingThemes = [];
        
        const themeArr = (themes, arr) => {
            if (!themes || typeof themes === 'null' || themes.length === 0) return;
            for (let op of themes) {
                //console.log(op);
                // AHHHHHH REGEX HELL I HATE REGEX RAAAAAAH I HATE MAL WHY DO THEY NOT HAVE CONSISTENT NAMING
                let match = "";
                if (op.text.toLowerCase().includes(' by ')) {
                    if (op.text.toLowerCase().includes('"')) {
                        match = op.text.match(/(?:#\d+:\s*)?"([^"]+)",?\s+by\s+([^(]+)?/i);
                    } else {
                        match = op.text.match(/(?:#\d+:\s*)?([^\"]+?)\s+by\s+([^(]+)?/i);
                    }
                } else if (op.text.toLowerCase().includes('"by')) {
                    match = op.text.match(/(?:#\d+:\s*)?"([^"]+)",?by\s+([^(]+)?/i);
                } else {
                    match = op.text.match(/(?:#\d+:\s*)?"([^"]+)",?\s+([^(]+)?/i);
                }
                if (!match || match.length === 0) continue;
                let [, title, artist] = match;
                //console.log("Here");
                if (!title) continue;
                artist = artist || '';
                
                arr.push({
                    title: title.trim(),
                    artist: artist.trim()
                });
            }
        }
        //console.log(anime.title);
        themeArr(anime.opening_themes, openingThemes);
        themeArr(anime.ending_themes, endingThemes);
        return {
            opening_themes: openingThemes,
            ending_themes: endingThemes
        };
    } catch (error) {
        console.log("Error fetching themes by id: ", error);
        throw error;
    }
}

export const getThemesByUsername = async (username, statuses, {includeOps = true, includeEds = true}) => {
    try {
        username = validString(username);
        if (!statuses || typeof statuses !== 'object' || !Array.isArray(statuses)) throw "Invalid statuses";
        if (typeof includeOps !== 'boolean' || typeof includeEds !== 'boolean') throw 'Invalide theme options';
        const animeList = await getAnimeList(username, statuses);
        const animeThemes = [];
        for (let anime of animeList) {
            const ops = await getThemesById(anime.node.id);
            const opening_themes = includeOps ? ops.opening_themes : [];
            const ending_themes = includeEds ? ops.ending_themes : [];
            animeThemes.push(...opening_themes, ...ending_themes);
        }
        return animeThemes;
    } catch (error) {
        console.log("Error fetching themes by username: ", error);
        throw error;
    }
}