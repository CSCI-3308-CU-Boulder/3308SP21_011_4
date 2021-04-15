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
            res.render("song-choice", { songs: [] , playlistid:null, playlistname:null});
        })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        });
});

//when user clicks 'make a playlist'
//the modal opens up, and they enter a description, name, & privacy val
app.get('/callback/makePlaylist', (req,res) => {
    const pname = req.query["playlistName"];
    const desc = req.query["playlistDescription"]; //get those from the url
    const private = req.query["privacy"];

    // console.log(pname, desc, private);

    //create a playlist with those attributes
    spotifyApi.createPlaylist(pname, {'description' : desc, 'public': private})
        .then((data) => {

            // then, render its id into the .hbs form. now the #if id thing will pass, & we can add songs
            res.render('song-choice', {songs:[], playlistid:data.body.id, playlistname:data.body.name});
        })
        .catch((err) => {
            console.log("Crap. : " + err);
            res.render('song-choice', {songs:[], playlistid:null, playlistname:null});
        })
})


//when user clicks 'add a song', the modal opens up, they enter a songname, etc.
//this endpoint searches the song they entered, and sends back 5 of the results.
//NOTICE: we're still passing around playlistid. pretty jank but it works
app.get("/callback/searchSong", (req, res) => {
    const song = req.query["songname"];
    const playlistid = req.query["playlistid"];

    var songsObj = {
        songs: []
    };

    spotifyApi
        .searchTracks(song, { limit: 5 })
        .then((data) => {
            data.body.tracks.items.forEach((item) => {
                var artists = [];
                item.artists.forEach((artist) => {
                    artists.push(artist.name);
                })
                songsObj.songs.push({
                    songname: item.name,
                    artists: artists,
                    link: item.uri //NOTICE: we're passing link URIs now. this is the checkbox's value in hbs
                })

            });
            // console.log(songsObj);

            //pass the songs returned from the call & playlistid back to the hbs
            res.render('song-choice', {songs: songsObj["songs"], playlistid:playlistid});
        })
        .catch((err) => {
            console.log(err);
        });
});

//now, when they click 'add that mfer' or w/e, we pass back
//  the song they chose to add (its uri)
//  the playlistid from waaaay earlier that we've been beachball-at-a-concerting around
app.get('/callback/addToQueue', (req,res) => {
    const songlink = req.query.songchoice; //get the uri of the song they chose
    const playlistid = req.query.playlistid; //get the id of the playlist they created earlier
    // console.log(songlink);
    spotifyApi.addTracksToPlaylist(playlistid, [songlink]); //ask spotify to add it to the playlist
    res.render('song-choice', {songs:[], playlistid:playlistid}); //send them back to hbs w/ no songs & the playlistid. rinse & repeat
})

app.listen(8888, console.log("Goto http://localhost:8888/login"));
