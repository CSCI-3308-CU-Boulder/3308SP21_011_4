const app = require("express")();
const path = require('path');
const SpotWAPI = require("spotify-web-api-node");

app.set('views',path.join(__dirname,"views"));
app.set("view engine", 'hbs');

const credentials = {
    clientId: "1721ccaf9f0f40a196710dede9030908",
    clientSecret: "7efbade01f16446a880254fe1f30d2a7",
    redirectUri: "http://localhost:8888/callback",
};

const scopes = ['user-read-currently-playing'];

var spotifyApi = new SpotWAPI(credentials);

app.get("/login", (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
})

app.get("/callback", (req,res) => {
    var code = req.query.code;
    var error = req.query.error;
    if (error) {
        console.error(`Oops!! : ${error}`);
        res.send(`Oops! ${error}`);
        return;
    }
    spotifyApi.authorizationCodeGrant(code)
        .then((data) => {
            const access_token = data.body["access_token"];
            spotifyApi.setAccessToken(access_token);

            spotifyApi.getMyCurrentPlayingTrack()
                .then((data) => {
                    // console.log(data);
                    const songname = data.body.item.name;
                    console.log(songname);
                    res.render('index', { song: data })
                })
            .catch((err) => {
                console.log(`not a chance: ${err}`);
                return;
            })
        })
        .catch((err) => {
            console.log("NO!" + err);
            return;
        })


})

app.get('/', (req,res) => {
    let artistList = random();
    res.render('index', { artist: artistList });
})

function random() {
    let list = ["Daft Punk", "Doja Cat", "Amtrac", "Grateful Dead"];
    let ind = Math.floor(Math.random() * (list.length-1)+0);
    return list.slice(ind);
}


app.listen(8888, console.log("Listening on http://localhost:8888/login"));
