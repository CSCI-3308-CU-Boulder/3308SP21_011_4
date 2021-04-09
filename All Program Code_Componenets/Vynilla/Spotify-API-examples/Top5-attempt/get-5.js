//"track detail information for album tracks"
const SpotWAPI = require("spotify-web-api-node");

const express = require("express");
const { response } = require("express");

const app = express();
app.set("view engine", "hbs");
app.use(express.static(__dirname + '/views'));
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

    //with our access code, we can now ask for an access token, which we can use to access the scopes we specified ^^
    spotifyApi
        .authorizationCodeGrant(code) //ask nicely. returns a promise containing our tokens

        .then((data) => {
            //get our tokens from that promise
            const access_token = data.body["access_token"];
            const refresh_token = data.body["refresh_token"];
            const expires_in = data.body["expires_in"];

            console.log("got em! \n access: " + access_token + "\n refresh: " + refresh_token);

            //globally set our tokens. this way, they will be used in all further calls. peepee poopoo
            //note that we'll have problems if we try to do something for which we don't have scope/permission
            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);
            res.render('profile', {
                name: 'dalbir',
                display_name: 'dabr2558',
                friend_count: '555',
                album: [ 'bandana', 'ye', 'after Hours' ],
                artist: [ 'Doja cat', 'drake', 'pink floyd'],
                friend: ['bado6868', 'yared4221', 'jake99'],
                profile_link: 'https://media-exp1.licdn.com/dms/image/C5603AQFyRCCZSpyyrg/profile-displayphoto-shrink_100_100/0/1613370728531?e=1623283200&v=beta&t=JgVqFQigP-7wCVM7V-oDmR6FHyWMBjsDmIXMgJyrkgY'
            });
        })
        .catch((error) => {
            console.error(`Problem getting tokens: ${error}`);
            res.send(`Problem getting tokens: ${error}`);
        });
});

app.get('/friendselectedqueue', function(req, res) {
    var afriend = req.query.selectedFriend;
    res.render('profile.hbs', {
        name: afriend,
        display_name: 'dabr2558',
        friend_count: '555',
        artist: [ 'Doja cat', 'drake', 'pink floyd'],
        album: [ 'bandana', 'ye', 'after Hours' ],
        friend: ['bado6868', 'yared4221', 'jake99'],
        profile_link: 'https://media-exp1.licdn.com/dms/image/C5603AQFyRCCZSpyyrg/profile-displayphoto-shrink_100_100/0/1613370728531?e=1623283200&v=beta&t=JgVqFQigP-7wCVM7V-oDmR6FHyWMBjsDmIXMgJyrkgY'
    });
    console.log(afriend);
});


app.get('/callback/searchSong', function(req, res) {
    var track = req.query.addSong + '';
    var trackArtist = req.query.songArtist + '';
    var trackquery = 'track:' + track + ' artist:' + trackArtist;
    var trackid = '';

    
    // check if we can search tracks by id '3TO7bbrUKrOSPGRTB5MeCz' ==> doesnt works
    spotifyApi.searchTracks(trackquery)
    .then((data) => {
        console.log('Search tracks ' + track, data.body);
        var trackid = trackid + data.body.tracks.items[0].id;
    })
    .catch(err => {
        res.send('error');
    });
    // all above goes into explore page

    // all below in rendering pfp
    var dbquery = 'SELECT TOPSONGS where id = req.session.userID';
    db.any(dbquery)
    .then((data) => {
        var songsObj = {
            songs: []
        };

        for (i = 0; i < data.length; i++){
            spotifyApi.getTrack(data[i])
            .then((data) => {
                var creator = data.body.artists[0].name;
                var trackname = data.body.name;
                songsObj.songs.push(
                    {
                        name: trackname,
                        artist: creator
                    }
                )
            })
        }
    });
    
});

app.get('/callback/searchAlbum', function(req, res) {
    var album = req.query.addAlbum + '';
    var albumArtist = req.query.ArtistofAlbum + '';
    var artistid = '';

    
    spotifyApi.searchArtists(albumArtist)
    .then((data) => {
        console.log('Artist information', data.body);
        artistid = artistid + data.body.artists.items[0].id;
        //res.send(data.body.artists.items[0].id);
    })
    .catch((err) => {
        console.log("Something went wrong in searchAlbum!", err);
    });
    
   
    spotifyApi.getArtistAlbums(artistid, {limit: 5})
    .then((data) => {
        res.send(data.body);
        //db.put(albumid)
        console.log('all albums', data);
    })
    .catch((err) => {
        console.log("Something went wrong in searchAlbum pt2!", err);
    });
    

    
    /* insert one of these or 5 of these? */
        // if one, then db return is sent to user no for loop
        // if five, then this obj needs to be put into above api call and then stuck into db
        var albumsObj = {
            "name": [],
            "artist": [],
            "image": []
        };
    
        //db.any(TOPALBUMS)
    //.then((data) => {
        
        
        // looping over list of artist id's stored in db
        // db stores list of ids ['1234', '5678']
        /*
        for (i = 0; i < data.length; i++) {
            var name = '';
            var img = ''
            spotifyApi
            .getArtist(data[i])
            .then((data) => {
                var name = name + data.body.name;
                var img = img + data.body.images[0].url;   // getting name and image from getArtist method
            })
            albumsObj.name.push(name);
            albumsObj.image.push(img);
        }*/
    //})
    
    
        // then loop through db using id and .getAlbum('insertid') to get album info and send
        // to page in json {name: 'name', Artist: 'name', coverArt:'url'}
});

app.get('/callback/searchArtist', function(req, res) {
    var searchArtist = req.query.addArtist + '';
    var query = 'SELECT TOPARTISTS WHERE id = req.session.userID';
    spotifyApi
    .searchArtists(searchArtist)
    .then((data) => {
        var searchid = ''; 
        console.log("got an artist from spotify " + data.body.artists.items[0].name);
        var searchid = searchid + data.body.artists.items[0].id;
        //db.put(searchid) // append to list in db?
    })
    // all above goes to explore

    // all below to app.js to load pfp
    //db.any(query);
    .then((data) => {
        //object to send to handlebars
        var artistsObj = {
            artists: []
        };
        
        // looping over list of artist id's stored in db
        for (i = 0; i < data.length; i++) {
            spotifyApi
            .getArtist(data[i])
            .then((data) => {
                var name = name + data.body.name;
                var img = img + data.body.images[0].url;
                artistsObj.artists.push(
                    {
                        name: name,
                        image: img
                    }
                );
            })
        }
    })
    .catch((err) => {
        console.log("Something went wrong in searchArtist!", err);
    });
});

// keep as post
app.post('/callback/removeSongs', function(req, res) {
    //db.put("")
    console.log('Client requested all Songs to be removed.');
});

// needs to be post
app.post('/callback/removeAlbums', function(req, res) {
    //db.put("")
    console.log('Client requested all Albums to be removed.');
});

// needs to be post
app.post('/callback/removeArtists', function(req, res) {
    //db.put("")
    console.log('Client requested all Artists to be removed.');
});


app.listen(8888, console.log("Okokok, goto http://localhost:8888/login !"));