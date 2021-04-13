const express = require("express");
const app = express();
const path = require("path");
const SpotWAPI = require("spotify-web-api-node");
const queryString = require("querystring");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

 const credentials = {
     clientId: "1721ccaf9f0f40a196710dede9030908",
     clientSecret: "7efbade01f16446a880254fe1f30d2a7",
     redirectUri: "http://localhost:8888/callback",
};

const scopes = ["playlist-modify-private", "playlist-modify-public"];

var spotifyApi = new SpotWAPI(credentials);

app.get("/login", (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/callback", (req, res) => {
    var code = req.query.code;
    var error = req.query.error;

    if (error) {
        console.log("Shit!");
        return;
    }

    spotifyApi.authorizationCodeGrant(code).then((data) => {
        const access_token = data.body["access_token"];
        spotifyApi.setAccessToken(access_token);

        res.render("explore", {songs: [], playlistid: null, playlistname:null});
    })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        })
});

app.get("/queue", (req,res) => {
    res.render("queue", {friends:["Bernardo", "Dalbir", "Jake"]});
})

app.get('/select-friend', (req,res) => {
    const friendname = req.query["friends-dropdown"];
    var friendObj = {
        name: friendname,
        playlistid: 1,
        queueSoFar: []
    }

    const theirq = req.query["theirqueue"];

    var songsObj = {
        songs: [
            {
                songname: "Poggoli", artist: ["Rav", "ioli"]
            },
            {
                songname: "Say So", artist: ["Doja Cat"]
            }
        ]
    }

    res.render("queue", {friend: friendObj, queue: songsObj["songs"], friends: ["Bernardo", "Dalbir", "Jake"]});
})

app.get("/search", (req,res) => {
    const songname = req.query["songname"];
    const friendname = req.query["friendname"];
    var friendObj = {
        name: friendname,
        playlistid: 1,
        queueSoFar: []
    }

    var songsObj = {
        songs: []
    }
    spotifyApi.searchTracks(songname, {limit: 5}).then((data) => {
        data.body.tracks.items.forEach((track) => {
            var artists = [];
            console.log(track.name);
            track.artists.forEach((artist) => {
                // console.log(artist.name);
                artists.push(artist.name);
            })
            songsObj["songs"].push({
                songname: track.name,
                artists: artists,
                link: track.uri
            })

        })
        console.log(songsObj["songs"])
        res.render("queue", {
            songsFromSearch:songsObj["songs"], //obvi we need to get this from DB
            queueSoFar: songsObj["songs"],//& this
            friend: friendObj,
            friends: ["Bernardo", "Dalbir", "Jake"]
        });
    }).catch((err) => {
        console.log("Shoot!" + err);
        return;
    })
})

app.listen(
    8888,
    console.log("goto http://localhost:8888/login")
)
