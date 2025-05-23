import axios from "axios";
import { validString, validNumber } from "../helpers.js";
import dotenv from "dotenv";
dotenv.config();

const client_id = process.env.MAL_CLIENT_ID;
const client_secret = process.env.MAL_CLIENT_SECRET;

export const getAnimeList = async (username) => {
    try {
        username = validString(username);
        const response = await axios.get(
        `https://api.myanimelist.net/v2/users/${username}/animelist`,
        {
            headers: {
                "X-MAL-CLIENT-ID": client_id
            },
            params: {
                limit: 1000,
                fields: "anime_id,list_status,anime_title",
            },
        });
        return response.data.data;
    } catch (error) {
        console.error("Error fetching anime list: ", error.response.data || error.message);
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
        console.error("Error fetching anime by name: ", error.response.data || error.message);
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
                let title, artist;
                if (op.text.toLowerCase().includes(' by ')) {
                    if (op.text.toLowerCase().includes('"')) {
                        [, title, artist] = op.text.match(/(?:#\d+:\s*)?"([^"]+)",?\s+by\s+([^(]+)?/i);
                    } else {
                        [, title, artist] = op.text.match(/(?:#\d+:\s*)?([^\"]+?)\s+by\s+([^(]+)?/i);
                    }
                } else if (op.text.toLowerCase().includes('"by')) {
                    [, title, artist] = op.text.match(/(?:#\d+:\s*)?"([^"]+)",?by\s+([^(]+)?/i);
                } else {
                    [, title, artist] = op.text.match(/(?:#\d+:\s*)?"([^"]+)",?\s+([^(]+)?/i);
                }
                
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
        console.log(error);
        throw error;
    }
}

export const getThemesByUsername = async (username) => {
    try {
        username = validString(username);
        const animeList = await getAnimeList(username);
        const animeThemes = [];
        for (let anime of animeList) {
            const ops = await getThemesById(anime.node.id);
            const opening_themes = ops.opening_themes;
            const ending_themes = ops.ending_themes;
            animeThemes.push(...opening_themes, ...ending_themes);
        }
        return animeThemes;
    } catch (error) {
        console.log(error);
        throw error;
    }
}