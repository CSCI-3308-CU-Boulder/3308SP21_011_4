const app = require("express")();
const path = require("path");
const SpotWAPI = require("spotify-web-api-node");
const qs = require('querystring');

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
            //then....
            res.render("queue", { songs: [] }); //present the user w/ the modal.hbs view
        })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        });
});

var songsToAdd = [];
// entering a songname & pressing search on the form sends a get req. to
// /callback/search w/ songname in url
app.get("/callback/search", (req, res) => {
    var trackname = req.query.songname;
    trackname = trackname.replace("+", " "); //want the search term to be in plain english
    // songs = [];
    var songsObj = {
        "songs": []
    };

    spotifyApi
        .searchTracks(trackname) //search the terms from the URL
        .then((data) => {
            //many songs are returned. iterate thru them
            data.body.tracks.items.forEach((song) => {
                //for each song...
                var artists = []; //who wrote it

                //for each artist on this song...
                song.artists.forEach((artist) => {
                    artists.push(artist.name); //add them to artists
                });

                //add an entry for the current song
                //whose 'artists' field is an array of all artists
                songsObj.songs.push({
                    songname: song.name,
                    artists: [...artists], //spread operator. kinda funky, definitely redundant, but it feels flex
                    id: "spotify:track:" + song.id
                });
            });

            songsToAdd.push(songsObj["songs"][0]);
            console.log(songsToAdd);
            res.render('queue', {songs: songsToAdd})

        })
        .catch((err) => {
            console.log("So close!! : " + err);
            return;
        });
});

app.post('/makePlaylist', (req,res) => {
     var songIDs = songsToAdd.map(function(obj) {
        console.log("fuck it!!! :" + obj.name);
        return obj[2];
    })

    console.log(req.body);

    spotifyApi.createPlaylist('My Love For U <3', {'description': 'Made with Vynilla!', 'public': true})
        .then((data) => {
            console.log('Created playlist!');
            console.log(data);
            return data;
        }).then((data) => {
            console.log(songIDs);
            return spotifyApi.addTracksToPlaylist(data.body.id, songIDs);
        })
        .catch((err) => {
            console.log("No playlist for u. " + err);
        })
        res.render('queue', {songs: []})
})


app.listen(8888, console.log("Goto http://localhost:8888/login"));

//meeting notes? lol
// jared - song search & live song display or what ur listening to
// bernardo - "      "
// jake  - profile picture stuff
// dalbir - profile page friends selector
// bo - hasn't responded, hasn't been active
// todo - work on integrating it all
