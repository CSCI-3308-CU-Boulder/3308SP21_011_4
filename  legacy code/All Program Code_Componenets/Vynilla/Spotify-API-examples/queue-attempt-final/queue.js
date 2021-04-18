const express = require("express");
const app = express();
const path = require("path");
const SpotWAPI = require("spotify-web-api-node");
const bodyParser = require("body-parser");
const pgp = require("pg-promise")();

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));

const dbConfig = {
    host: "localhost",
    port: 5432,
    database: "example_proj_db",
    user: "postgres",
    password: "4266",
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

    spotifyApi
        .authorizationCodeGrant(code)
        .then((data) => {
            const access_token = data.body["access_token"];
            spotifyApi.setAccessToken(access_token);

            res.render("explore");
        })
        .catch((err) => {
            console.log("Couldn't auth!! : " + err);
        });
});

app.get("/queue", (req, res) => {
    const getAllUsers = "select person from users;"; //for dev purposes, to sim switching users w/o actually needing to
    var users = [];
    db.any(getAllUsers)
        .then((data) => {
            // console.log("select person from users:");
            // console.table(data);
            data.forEach((person) => {
                users.push(person.person);
            });

            // console.log('\n users array:');
            // console.table(users);
            res.render("queue", { users: users, message: "in /queue, all working well" });
        })
        .catch((err) => {
            console.error(err);
            res.render("queue", { message: "messed up somewhere in /queue" });
        });
});

app.get("/select-self", (req, res) => {
    const selfName = req.query["self-dropdown"];
    const getSelfID = "select id from users where person='" + selfName + "';";
    const getFriendNamesIDs = "select person, id from users u inner join relations r on (u.id = r.user2) where r.user1 = (select id from users where person = '" + selfName + "');";
    var friends = [];
    db.any(getFriendNamesIDs)
        .then((data) => {
            // console.table(data);
            data.forEach((entry) => {
                friends.push({
                    name: entry.person,
                    id: entry.id,
                });
            });
            // console.table(friends);
            db.any(getSelfID)
                .then((data) => {
                    res.render("queue", {
                        message: "all's fine from /select-self",
                        friends: friends,
                        users: ["Youre already someone!"],
                        self: data[0].id, //probably not necessary since we have cookies and stuff
                    });
                })
                .catch((err) => {
                    res.render("queue", {
                        message: "fucked up in /select-self",
                    });
                });
        })
        .catch((err) => {
            console.error(err);
            res.render("queue", {
                message: "something's fucked in /select-self",
            });
        });
});

app.get("/select-friend", (req, res) => {
    const selfID = req.query["madeq"];
    // console.log('\n selfID:'+selfID+'\n')
    const selectedFriend = req.query["friends-dropdown"]; //id of selected friend
    const playlistQuery = "select * from queues where madequeue = '" + selfID + "' and theirqueue='" + selectedFriend + "';";
    const getFriendNamesIDs = "select person, id from users u inner join relations r on (u.id = r.user2) where r.user1 = (select id from users where id = " + selfID + ");";
    db.any(playlistQuery).then((data) => {
        var friendsArr = [];
        db.any(getFriendNamesIDs)
            .then((friends) => {
                friendsArr = friends.map((friend) => {
                    return { name: friend.person, id: friend.id };
                });
                console.log(friendsArr);

                if (data.length === 0) {
                    res.render("queue", {
                        message: "empty queue from /select friend",
                        theirQueue: false,
                        friend: selectedFriend,
                        friends: friendsArr,
                        self: selfID,
                    });
                } else {
                    // console.table(data);
                    const getFriendSongs = "select songLink from songs where isFrom = " + selfID + " and isTo=" + selectedFriend + ";";
                    db.any(getFriendSongs)
                        .then((data) => {
                            console.table(data);

                            res.render("queue", {
                                message: "queue found in /select friend!!",
                                theirQueue: true,
                                friend: selectedFriend,
                                friends: friendsArr,
                                self: selfID,
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                }
            })
            .catch((err) => {
                console.error(err);
            });
    });
});

app.get("/make_queue", (req, res) => {
    const selfID = req.query["selfID"];
    const friendID = req.query["friendID"];
    const queueName = req.query["queue_name"];

    const createQueue = "insert into queues values(" + selfID + ", " + friendID + ", '" + queueName + "');";
    const getFriendNamesIDs = "select person, id from users u inner join relations r on (u.id = r.user2) where r.user1 = (select id from users where id = " + selfID + ");";
    // console.log(createQueue);
    db.any(createQueue)
        .then((data) => {
            db.any(getFriendNamesIDs)
                .then((friends) => {
                    var friendsArr = friends.map((friend) => {
                        return { name: friend.person, id: friend.id };
                    });

                    res.render("queue", {
                        message: "made them a queue",
                        theirQueue: true,
                        friend: friendID,
                        friends: friendsArr,
                        self: selfID,
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.get("/search", (req, res) => {
    const songname = req.query["songname"];
    const friendname = req.query["friendname"];
    const selfID = req.query["selfID"];
    const getFriendNamesIDs = "select person, id from users u inner join relation r on (u.id = r.user2) where r.user1=(select id from users where id='" + selfID + "');";
    db.any(getFriendNamesIDs)
        .then((friends) => {
            var friendsArr = friends.map((friend) => {
                return { name: friend.person, id: friend.id };
            });
            var songsObj = {
                songs: [],
            };
            spotifyApi
                .searchTracks(songname, { limit: 5 })
                .then((data) => {
                    data.body.tracks.items.forEach((track) => {
                        var artists = [];
                        // console.log(track.name);
                        track.artists.forEach((artist) => {
                            // console.log(artist.name);
                            artists.push(artist.name);
                        });
                        songsObj["songs"].push({
                            songname: track.name,
                            artists: artists,
                            link: track.uri,
                        });
                    });
                    // console.table(songsObj["songs"])
                    res.render("queue", {
                        songsFromSearch: songsObj["songs"], //obvi we need to get this from DB
                        queueSoFar: songsObj["songs"], //& this
                        friend: friendname,
                        friends: friendsArr,
                        self: selfID,
                    });
                })
                .catch((err) => {
                    console.log("Shoot!" + err);
                    return;
                });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.get("/addToPlaylist", (req, res) => {
    const song = req.query["songLink"];
    const friendID = req.query["friendname"];
    const selfID = req.query["selfID"];
    console.log(" ----- in /addToPlaylist ------- ");
    console.log(selfID);
    console.log('---------------------------------');

    const addToSongs = "insert into songs values (" + selfID + ", " + friendID + ", '" + song + "');";
    const getFriendsNamesIDs = "select person, id from users u inner join relation r on (u.id = r.user2) where r.user1=(select id from users where id='" + selfID + "');";
    db.any(getFriendsNamesIDs).then((friends) => {
        console.log('friendssss')
        console.log(friends)
        var friendsArr = friends.map((friend) => {
            return { name: friend.person, id: friend.id };
        });
        db.any(addToSongs)
            .then((data) => {
                console.log('data');
                console.log(data);
            })
            .catch((err) => {
                console.log('error');
                console.error(err);


                db.any("select * from songs;")
                    .then((data) => {
                        console.log('data1')
                        console.log(data);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                res.render("queue", {
                    message: "added song to queue",
                    friends: friendsArr,
                    self: selfID,
                    friend: friendID
                });
            });
    });
});

app.listen(8888, console.log("goto http://localhost:8888/login"));
