const SpotWAPI = require("spotify-web-api-node");
const express = require("express");
const playlistName = "Hacking....";
const playlistDesc = "Get HACKED.";
const artist = "Doja Cat";

const app = express();

const credentials = {
    clientId: "1721ccaf9f0f40a196710dede9030908",
    clientSecret: "7efbade01f16446a880254fe1f30d2a7",
    redirectUri: "http://localhost:8888/callback",
}

const scopes = [
    "playlist-modify-public"
]

var spotifyApi = new SpotWAPI(credentials);

app.get("/login", (req,res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});


app.get("/callback", (req,res) => {
    var code = req.query.code;
    var refresh = req.query.refresh;
    var error = req.query.error;
    var songsArr = [];
    if (error) {
        console.error(`Oops!! : ${error}`);
        res.send(`Oops! ${error}`);
        return;
    }

    spotifyApi.authorizationCodeGrant(code)
        .then((data) => {
            const access_token = data.body["access_token"];
            const refresh_token = data.body["refresh_token"];
            const expires_in = data.body["expires_in"];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            //search for 5 of doja's songs
            spotifyApi.searchTracks('artist:'+artist,
                { limit : 5 }
            )

            //structure of 'data':
            //{
            // body: {
            //   tracks: {
            //     href: 'https://api.spotify.com/v1/search?query=artist%3ADoja+Cat&type=track&offset=0&limit=20',
            //     items: [Array],
            //     limit: 20,
            //     next: 'https://api.spotify.com/v1/search?query=artist%3ADoja+Cat&type=track&offset=20&limit=20',
            //     offset: 0,
            //     previous: null,
            //     total: 140
            //   }
            // },
            // headers: {
            //   'content-type': 'application/json; charset=utf-8',
            //   'cache-control': 'public, max-age=7200',
            //   ...
            //   'transfer-encoding': 'chunked'
            // },
            // statusCode: 200
            // }

                .then((data) => {
                    // console.log('Searching tracks by ' + artist);
                    // console.log('\nTracks by: ' + artist);
                    // console.log(data.body.tracks.items);
                    data.body.tracks.items.forEach(song => {
                        // console.log(song.name + ", id: " + song.id);
                        songsArr.push("spotify:track:"+song.id);
                    })
                    return songsArr;
                }).then((songs) => {
                    console.log(songs);
                })
        })
        .then( () => {
            console.log("\n:D");
        }
         )
        .catch((err) => {
            console.error(`Problem getting tokens: ${error}`);
            res.send(`Problem getting tokens: ${error}`);
        })
})

app.listen(8888, console.log("Sweet, let's find some songs by " + artist +".\n Go visit http://localhost:8888/login"));


