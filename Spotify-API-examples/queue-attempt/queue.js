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
        songs: [],
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
                    id: "spotify:track:" + song.id,
                });
            });

            songsToAdd.push(songsObj["songs"][0]);
            console.log(songsToAdd);
            res.render("queue", { songs: songsToAdd });
        })
        .catch((err) => {
            console.log("So close!! : " + err);
            return;
        });
});

app.get("/callback/makePlaylist", (req, res) => {

    //check the URL after selecting to make the playlist;
    //'songnames' fields r their responses in each textbox
    const songsarr = req.query["songnames"];
    const playlistname = req.query["playlistname"];
    // console.log(songsarr);

    const songIDs = []; //array in which to store songarrs' songs' ids

    //>1 song in song arr
    if (songsarr.length > 1) {
        songsarr.forEach((song) => {
            spotifyApi.searchTracks(song).then((data) => {
                console.log(song + " with " + data.body.tracks.items[0].id);
                songIDs.push("spotify:track:"+data.body.tracks.items[0].id);
            })
        })
    } else {
        spotify.searchTracks(songsarr).then((data) => {
            songIDs.push("spotify:track:"+data.body.tracks.items[0].id);
        })
    }

    // console.log(songIDs);

    //create playlist
    //return its ID to the addTracks call, which we give the array of songIDs
    spotifyApi
        .createPlaylist(playlistname, { description: "Made with Vynilla!", public: true })
        .then((data) => {
            console.log("Created playlist!");
            return data;
        })
        .then((data) => {
            return spotifyApi.addTracksToPlaylist(data.body.id, songIDs);
        })
        .catch((err) => {
            console.log("No playlist for u. " + err);
        });
    res.render("queue", { songs: [] });
});

app.listen(8888, console.log("Goto http://localhost:8888/login"));

//meeting notes? lol
// jared - song search & live song display or what ur listening to
// bernardo - "      "
// jake  - profile picture stuff
// dalbir - profile page friends selector
// bo - hasn't responded, hasn't been active
// todo - work on integrating it all
