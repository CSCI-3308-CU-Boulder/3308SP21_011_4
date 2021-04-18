const app = require("express")();
const path = require("path");
const SpotWAPI = require("spotify-web-api-node");
const querystring = require("querystring");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const credentials = {
    clientId: "1721ccaf9f0f40a196710dede9030908",
    clientSecret: "7efbade01f16446a880254fe1f30d2a7",
    redirectUri: "http://localhost:8888/callback",
};

const scopes = ["playlist-modify-private", "playlist-modify-public"];

var spotifyApi = new SpotWAPI(credentials);

//auth ourselves
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

    spotifyApi
        .authorizationCodeGrant(code)
        .then((data) => {
            const access_token = data.body["access_token"];
            spotifyApi.setAccessToken(access_token); //globally auth ourselves to access 'search'

            //params:
            //playlistid: we don't want the 'add songs' button to render at first, so just pass null playlist id.
            //  look in .hsb file for {{#if playlistid}}. this conditionally renders 'add songs' btn.
            res.render("album-choice", { albums: [] , albumname:null});
        })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        });
});

app.listen(8888, console.log("Goto http://localhost:8888/login"));
