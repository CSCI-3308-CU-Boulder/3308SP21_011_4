const SpotWAPI = require("spotify-web-api-node");
const express = require("express");
// const playlistName = "Hacking....";
// const playlistDesc = "Get HACKED.";
const songs = ["Say So", "With Arms Wide Open", "Bleecker Street", "Heartless", "(Don't Fear) The Reaper",
               "Human After All", "Interstate Love Song", "Great Dane", "Cherub Rock", "Beverly Hills"];

const app = express();

const credentials = {
    clientId: "1721ccaf9f0f40a196710dede9030908",
    clientSecret: "7efbade01f16446a880254fe1f30d2a7",
    redirectUri: "http://localhost:8888/callback",
};

const scopes = ["playlist-modify-public"];

var spotifyApi = new SpotWAPI(credentials);

app.get("/login", (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/callback", (req, res) => {
    var code = req.query.code;
    var refresh = req.query.refresh;
    var error = req.query.error;
    var songsArr = [];
    if (error) {
        console.error(`Oops!! : ${error}`);
        res.send(`Oops! ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then((data) => {
            const access_token = data.body["access_token"];
            const refresh_token = data.body["refresh_token"];
            const expires_in = data.body["expires_in"];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            songs.forEach(song => {
                spotifyApi.searchTracks(song, {limit:1})
                    .then((data) => {
                        console.log(data.body.tracks.items[0].name, " ", data.body.tracks.items[0].id);
                        console.log(data.body.tracks.items[0].artists[0].name);
                        songsArr.push('spotify:track:'+data.body.tracks.items[0].id);
                    })

            })

            return songsArr;
        })
               //take songsArr as 'songs'
               .then((songs) => {

                   //create a playlist
                   return spotifyApi
                       .createPlaylist("Hacking... :O", {
                           description: "testing!",
                           public: true,
                       })

                       //data = json obj. of playlist info.
                       //we need the playlistid to add songs to it
                       .then((data) => {
                           // console.log(data.body.id);
                           // add songs to playlist we just created
                           return spotifyApi.addTracksToPlaylist(data.body.id, songs);
                       })
                       .catch((err) => {
                           console.log("oops!: ", err);
                       });
               })
               .catch((err) => {
                   console.log("Oh crap!:", err);
               });

});

app.listen(8888, console.log("Sweet, let's find those songs!! \n Go visit http://localhost:8888/login"));
