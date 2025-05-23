import axios from "axios";
import qs from 'qs';
import { validString, validNumber } from "../helpers.js";
import dotenv from "dotenv";
dotenv.config();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

/** AUTH **/

// Generate a token when logging in
export const getSpotifyTokens = async (code) => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            qs.stringify({
                grant_type: 'authorization_code',
                redirect_uri: redirect_uri,
                code: validString(code),
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
                },
            }
        );
        return {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
        };
  } catch (error) {
        console.error('Error fetching Spotify tokens:', error);
        throw error;
  }
};

// Refresh the token when it expires
export const refreshSpotifyToken = async (refresh_token) => {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: validString(refresh_token),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
        },
      }
    );

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    throw error;
  }
};

// Get the access token, and refresh if needed
export const getValidAccessToken = async (req) => {
  const session = req.session.spotify;

  if (!session || !session.access_token || !session.refresh_token) {
    throw 'No Spotify session found';
  }

  const now = Date.now();
  if (now >= session.expires_at) {
    const refreshed = await refreshSpotifyToken(session.refresh_token);
    req.session.spotify.access_token = refreshed.access_token;
    req.session.spotify.expires_at = now + refreshed.expires_in * 1000;
  }

  return req.session.spotify.access_token;
};

/** DATA **/
export const getSong = async (access_token, title, artist) => {
    try {
        access_token = validString(access_token);
        title = validString(title);
        try {
            artist = validString(artist);
        } catch (error) {
            artist = "";
        }
        const response = await axios.get(
        `https://api.spotify.com/v1/search`,
        {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
            params: {
                q: `track:${title} artist:${artist}`,
                type: "track",
                limit: 1, // 5
            },
        });

        if (!response.data.tracks.items || response.data.tracks.items.length === 0) {
            return null;
        }
        const track = response.data.tracks.items[0];
        return {
            //name: track.name,
            //artist: track.artists.map((a) => a.name).join(', '),
            uri: track.uri,
            //id: track.id,
            //url: track.external_urls.spotify
            };
    } catch (error) {
        console.error("Error fetching fetching spotify track: ", error);
        throw error;
    }
}

export const getSongsFromList = async (access_token, songList) => {
    try {
        //console.log(access_token);
        access_token = validString(access_token);
        //console.log(songList);
        if (!songList || typeof songList !== 'object' || !Array.isArray(songList)) throw "Invalid songList";
        let allSongs = []
        // Structurally integral console log????
        //console.log(songList);
        for (let song of songList) {
            if (!song || typeof song !== 'object' || !song.title) continue;
            let title = validString(song.title);
            let artist = ""
            try {
                artist = validString(song.artist);
            } catch (error) {
                artist = "";
            }
            let result = await getSong(access_token, title, artist);
            //console.log(result);
            if (result !== null) allSongs.push(result.uri);
        }
        //console.log(allSongs);
        return allSongs;
    } catch (error) {
        console.error("Error fetching songs from list: ", error);
        throw error;
    }
}

export const createPlaylist = async (access_token, userId, songList, isPublic=false, name="My Anime Playlist", description="This Was created by DJ Waifu using my watchlist!") => {
    try {
        access_token = validString(access_token);
        //console.log("Access token:", access_token);
        userId = validString(userId);
        //console.log("User ID:", userId)
        //console.log(songList);
        if (!songList || typeof songList !== 'object' || !Array.isArray(songList)) throw "Invalid songList";
        //console.log(isPublic);
        //if (!isPublic || typeof isPublic !== 'boolean') throw 'isPublic must be a boolean';
        //console.log("Is public:", isPublic);
        name = validString(name);
        description = validString(description);
        const response = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
                name: name,
                public: isPublic,
                description: description,
            },
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        //console.log(response.data.id);

        if (!response.data.id) throw "Failed to create playlist";
        //console.log("HERE!");
        //console.log(songList);
        let allSongs = await getSongsFromList(access_token, songList);
        //console.log(allSongs);
        //allSongs = allSongs.map(song => song.uri);
        //console.log(allSongs);
        // Maximum of 100 items per request
        for (let i = 0; i < allSongs.length; i += 100) {
            //console.log(allSongs.slice(i, i + 100));
            let res = await axios.post(
                `https://api.spotify.com/v1/playlists/${response.data.id}/tracks`,
                {
                    'uris': allSongs.slice(i, i + 100),
                },
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!res.data.snapshot_id) throw "Failed to add to playlist";
        }
        // playlist create response
        //console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating playlist: ", error);
        throw error;
    }
}

export const uploadImage = async (access_token, playlistId, imageBuffer) => {
    try {
        access_token = validString(access_token);
        playlistId = validString(playlistId);
        if (!imageBuffer || typeof imageBuffer !== 'object' || !Buffer.isBuffer(imageBuffer)) throw "Invalid playlist image";
        const stringImage = imageBuffer.toString('base64');
        await axios.put(`https://api.spotify.com/v1/playlists/${playlistId}/images`,
            stringImage,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'image/jpeg',
                }
            }
            );
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw error;
    }
}

export const getPlaylist = async (access_token, playlistId) => {
    try {
        access_token = validString(access_token);
        playlistId = validString(playlistId);
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`,
            { headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            } }
        );
        if (!response.data.id) throw "Failed to fetch playlist";
        return response.data;
    } catch (error) {
        console.error("Error fetching playlist:", error);
        throw error;
    }
}