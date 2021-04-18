const express = require("express");
const app = express();
const path = require("path");
const SpotWAPI = require("spotify-web-api-node");
const bodyParser = require('body-parser');
const pgp = require("pg-promise")();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'example_proj_db',
    user: 'postgres',
    password: '4266'
};

var db = pgp(dbConfig);

 const credentials = {
     clientId: "1721ccaf9f0f40a196710dede9030908",
     clientSecret: "7efbade01f16446a880254fe1f30d2a7",
     redirectUri: "http://localhost:8888/callback",
};

const scopes = ["playlist-modify-private", "playlist-modify-public"];

var spotifyApi = new SpotWAPI(credentials);

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

    spotifyApi.authorizationCodeGrant(code).then((data) => {
        const access_token = data.body["access_token"];
        spotifyApi.setAccessToken(access_token);

        res.render("explore", {songs: [], playlistid: null, playlistname:null});
    })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        })
});

app.get("/queue", (req,res) => {
    var friendsQuery = 'SELECT person FROM relation;';
    db.any(friendsQuery)
        .then((data) => {
            console.table(data);
            var friendsArr = [];
            data.forEach((friend) => {
                friendsArr.push(friend.person);
            })
            res.render("queue", {friends: friendsArr});
        })
        .catch((err) => {
            console.error(err);
            res.render("queue", {friends: []})
        })
})

app.get('/select-friend', (req,res) => {
    const friendname = req.query["friends-dropdown"];
    const friendQuery = "SELECT * FROM relation WHERE person='"+friendname+"';";
    const friendsQuery = "SELECT * FROM relation;";
    var friends = [];

    db.any(friendsQuery).then((data) => {
        data.forEach((friend) => {
            friends.push(friend.person);
        })
    })
    .catch((err) => {console.error(err)});

    db.any(friendQuery)
        .then((friend)=>{
            var friend = friend[0];
            var name = friend.person;
            var their_q = friend.playlistid;
            if (their_q == 'none') {
                res.render('queue', {
                    friend: name,
                    theirQueue: false,
                    friends: friends
                })
                return;
            } else {
                var songsObj = {
                    songs : []
                }
                //get their queue
                console.log("In "+name+"'s queue...");
                spotifyApi.getPlaylist(their_q).then((data) => {
                    const playlistTracks = data.body.tracks.items;
                    playlistTracks.forEach((song) => {
                        var artists = [];
                        console.log(song.track.name);
                        song.track.artists.forEach((artist) => {
                            artists.push(artist.name);
                            console.log(" --- " + artist.name);
                        })
                        songsObj["songs"].push({
                            songname: song.track.name,
                            artists: artists
                        })
                    })
                    res.render('queue', {
                        friend: name,
                        theirQueue: true,
                        friends: friends,
                        currentQueue: songsObj["songs"]
                    })

                })
                .catch((err) => {
                    console.error(err);
                })
                console.log("-----outhere ------")
                console.log(songsObj["songs"])
                // res.render('queue', {
                //     friend: name,
                //     theirQueue: true,
                //     friends: friends,
                //     currentQueue: songsObj["songs"]
                // })
            }
        })
    .catch((err)=>{console.error(err)});

})

app.get("/make_queue", (req, res) => {
    var friendname = req.query["friendname"];
    var queuename = req.query["queue_name"];

    const getTheirFriends = "SELECT * FROM relation;"; //obvi we wanna use a relationship table or w/e
    const friends = [];

    db.any(getTheirFriends).then((data) => {
        data.forEach((friend) => {
            friends.push(friend.person);
        })
    })
    spotifyApi.createPlaylist(queuename, {'description': "Made with Vynilla!", 'public' : true})
        .then((data) => {
            // console.log(data);
            var queueid = data.body.id;
            var query = "update users set playlistid = '"+queueid+"' where person = '"+friendname+"';"
            db.any(query)
                .then((data) => {
                    res.render('queue', {
                        friend: friendname,
                        theirQueue: true,
                        friends: friends
                    })
                })
                .catch((err) => {console.error(err)})
        })
})


app.get("/search", (req,res) => {
    const songname = req.query["songname"];
    const friendname = req.query["friendname"];

    var songsObj = {
        songs: []
    }
    spotifyApi.searchTracks(songname, {limit: 5}).then((data) => {
        data.body.tracks.items.forEach((track) => {
            var artists = [];
            // console.log(track.name);
            track.artists.forEach((artist) => {
                // console.log(artist.name);
                artists.push(artist.name);
            })
            songsObj["songs"].push({
                songname: track.name,
                artists: artists,
                link: track.uri
            })

        })
        console.table(songsObj["songs"])
        res.render("queue", {
            songsFromSearch:songsObj["songs"], //obvi we need to get this from DB
            queueSoFar: songsObj["songs"],//& this
            friend: friendname,
            friends: ["Bernardo", "Dalbir", "Jake"]
        });
    }).catch((err) => {
        console.log("Shoot!" + err);
        return;
    })
})

app.get('/addToPlaylist', (req,res) => {
    const song = req.query["songLink"];
    const name = req.query["friendname"];

    const getTheirFriends = "SELECT * FROM friends;"; //obvi we wanna use a relationship table or w/e
    const friends = [];

    db.any(getTheirFriends).then((data) => {
        data.forEach((friend) => {
            friends.push(friend.person);
        })
    })
    .catch((err) => {console.error(err)})

    const getFriendPlaylist = "SELECT playlistid FROM relation  WHERE person='"+name+"';";
    const getSongQueueThings = 'select * from songs';
    db.any(getSongQueueThings)
        .then((data) => {
            console.log(data);
        })
        .catch((err) => {
            console.error(err);
        })

    db.any(getFriendPlaylist)
        .then((data) => {
            const theirq = data[0].playlistid;
            spotifyApi.addTracksToPlaylist(theirq, [song]).then((data) => {
                console.log("Added song...");
            })
                .then(() => {
                    var songsObj = {
                        songs: []
                    }
                    spotifyApi.getPlaylist(theirq)
                        .then((data) => {
                            const playlistTracks = data.body.tracks.items;
                            playlistTracks.forEach((song) => {
                                var artists = [];
                                song.track.artists.forEach((artist) => {
                                    artists.push(artist.name);
                                })
                                songsObj["songs"].push({
                                    songname: song.track.name,
                                    artists: artists
                                })
                            })
                        res.render('queue', {
                            friend: name,
                            theirQueue: true,
                            friends: friends,
                            currentQueue: songsObj["songs"]
                        })
                    })
                })
        .catch((err) => {console.error(err)})

        })
})

app.listen(
    8888,
    console.log("goto http://localhost:8888/login")
)
