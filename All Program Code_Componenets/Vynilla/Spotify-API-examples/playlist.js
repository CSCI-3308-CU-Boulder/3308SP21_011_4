//bring in modules
const SpotWAPI = require("spotify-web-api-node");
const express = require("express");

const app = express();

//set credentials of our app
const credentials = {
    clientId: "1721ccaf9f0f40a196710dede9030908",
    clientSecret: "7efbade01f16446a880254fe1f30d2a7",
    redirectUri: "http://localhost:8888/callback",
};

//scopes we'll need access to
const scopes = [
    "user-read-private", //read details about a user
    "playlist-modify-public", //create, add songs to, etc. a playlist
];

//instantiate a spotifywebapi object with our credentials
var spotifyApi = new SpotWAPI(credentials);

//get requests to 'localhost:8888/login' get sent to spotify's auth url
//this 'creates' an auth. url for the requested scopes
app.get("/login", (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

//that authorization url then redirects the visitor to the specified redirectUri (way up there^^)
//the req. it sends contains our auth. code (!= access code), a refresh code, and any errors
app.get("/callback", (req, res) => {
    //get our codes from the redirect
    var code = req.query.code;
    var error = req.query.error;
    var refresh = req.query.refresh;

    if (error) {
        console.error(`Oops! : ${error}`);
        res.send(`Oops! : ${error}`);
        return;
    }

    //with our access code, we can now ask for an access token, which we can use to access the scopes we specified ^^
    spotifyApi
        .authorizationCodeGrant(code) //ask nicely. returns a promise containing our tokens

        .then((data) => {
            //get our tokens from that promise
            const access_token = data.body["access_token"];
            const refresh_token = data.body["refresh_token"];
            const expires_in = data.body["expires_in"];

            console.log("got em! \n access: " + access_token + "\n refresh: " + refresh_token);

            //globally set our tokens. this way, they will be used in all further calls.
            //note that we'll have problems if we try to do something for which we don't have scope/permission
            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            //now we're in business!!! let's create a playlist
            return spotifyApi
                .createPlaylist("Hacker playlist xDxDxD", { description: "*cracks knuckles* time to hack the CIA.", public: true })
                .then((data) => {
                    console.log("Created playlist!");
                })
                .catch((err) => {
                    console.log("Something went wrong!", err);
                });
        })
        .then((data) => {
            console.log("Ok, playlist created. Check your library!!!");
        })
        .catch((error) => {
            console.error(`Problem getting tokens: ${error}`);
            res.send(`Problem getting tokens: ${error}`);
        });
});

app.listen(8888, console.log("Okokok, goto http://localhost:8888/login !"));
