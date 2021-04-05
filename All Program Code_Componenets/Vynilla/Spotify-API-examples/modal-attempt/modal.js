const app = require("express")();
const path = require("path");
const SpotWAPI = require("spotify-web-api-node");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const credentials = {
    clientId: "1721ccaf9f0f40a196710dede9030908",
    clientSecret: "7efbade01f16446a880254fe1f30d2a7",
    redirectUri: "http://localhost:8888/callback",
};

const scopes = [];

var spotifyApi = new SpotWAPI(credentials);

app.get("/modal");
app.get("/login", (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/callback", (req, res) => {
    var trackname = "Say So";
    var artistname = "Doja Cat";
    // var trackname = req.query.trackname;
    // var artistname = req.query.artistname;
    // trackname = trackname.replace("+", " ");
    // artistname = artistname.replace("+", " ");

    var code = req.query.code;
    var error = req.query.error;

    if (error) {
        console.log("Shit!");
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then((data) => {
            const access_token = data.body["access_token"];
            spotifyApi.setAccessToken(access_token);

            // spotifyApi.searchTracks('track:Alright artist:Kendrick Lamar')
            spotifyApi
                .searchTracks("track:" + trackname + " artist:" + artistname)
                .then((data) => {
                    res.render("modal", { songs: [] });
                })
                .catch((err) => {
                    console.log("Couldn't get tracks?? uhh: " + err);
                    return;
                });
        })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        });
});

app.get("/callback/search", (req, res) => {
    var trackname = req.query.songname;
    var artistname = req.query.artistname;
    trackname = trackname.replace("+", " ");
    artistname = artistname.replace("+", " ");
    console.log(trackname, artistname);
    songs = []

    spotifyApi.searchTracks("track:" + trackname + " artist:" + artistname)
        .then((data) => {
            console.log(data);
            console.log(data.body);
            data.body.tracks.items.forEach((song) => {
                // console.log(": " + song.name);
                songs.push(song.name);
            })

            res.render('modal', {songs:songs});
        })
        .catch((err) => {
            console.log("So close!! : " + err);
            return;
        })

});

app.listen(8888, console.log("Goto http://localhost:8888/login"));
