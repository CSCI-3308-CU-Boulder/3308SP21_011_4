// this program will update the html on the profile page based on input information and the 

const SpotWAPI = require("spotify-web-api-node");

const express = require("express");
const { response } = require("express");

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
    "ugc-image-upload"
];

//instantiate a spotifywebapi object with our credentials
var spotifyApi = new SpotWAPI(credentials);

//get requests to 'localhost:8888/login' get sent to spotify's auth url
//this 'creates' an auth. url for the requested scopes
app.get("/login", (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});


/* trying to double dip  "/pfpicture", */
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

    // use spotify api to save to db instead of sending to page
    spotifyApi
        .authorizationCodeGrant(code) //ask nicely. returns a promise containing our tokens

        .then((data) => {
            //get our tokens from that promise
            const access_token = data.body["access_token"];
            const refresh_token = data.body["refresh_token"];
            const expires_in = data.body["expires_in"];
            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);
            
            spotifyApi
                .getMe()
                .then((data) => {
                    console.log("got me from inside user");
                    res.send(data.body); // send all user data from spotify
                })
                .catch((err) => {
                    console.log("Something went wrong in getMe!", err);
            }); 
            
    
        })
        .catch((error) => {
            console.error(`Problem getting tokens: ${error}`);
            res.send(`Problem getting tokens: ${error}`);
        });
});

app.listen(8888, console.log("Okokok, goto http://localhost:8888/login !"));