const express = require("express");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var session = require('express-session');
const SpotifyWebApi = require('spotify-web-api-node');

dotenv.config({ path: './.env'});

const app = express();

//connect to mysql database
var db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE
});

//DISCONNET BUG ??
var db_config = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE
  };

  var connection;

  function handleDisconnect() {
    db = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.
  
    db.connect(function(err) {              // The server is either down
      if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    db.on('error', function(err) {
      console.log('db error', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
        handleDisconnect();                         // lost due to either server restart, or a
      } else {                                      // connnection idle timeout (the wait_timeout
        throw err;                                  // server variable configures this)
      }
    });
  }

  handleDisconnect();
  //DISCONNECT BUG FIX

//create a spotifyAPI instance w/ our credentials
const spotifyApi = new SpotifyWebApi({
    redirectUri: 'http://vynilla-app.herokuapp.com/callback', // where to send user after authentication
    clientId: '1721ccaf9f0f40a196710dede9030908',
    clientSecret: '7efbade01f16446a880254fe1f30d2a7'
});

//scopes that we will request access to
const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
  ];

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL Connected...")
    }
})

//specify where express should look for static files (stylesheets, etc)
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

//cookie initialization(?)
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
// setInterval(function () {
//     db.query('SELECT 1');
//     console.log("Still Connected...");
// }, 4000);

// parse application/x-www-form-urlencoded, basically can only parse incoming Request Object if strings or arrays
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

//tell express that we're using hbs templating
app.set('view engine', 'hbs');

//define our routes
app.use('/', require('./routes/pages.js'));
app.use('/auth', require('./routes/auth'));

//redirect connections to spotify's auth. url, asking for permission with the aforementioned scopes
app.get('/connect-spotify', (req, res) => {
    return res.redirect(spotifyApi.createAuthorizeURL(scopes));
})

//upon authorization, spotify redirects the user to /callback, with the desired auth. codes
app.get('/callback', (req, res) => {
    const code = req.query.code; //get the authorization code
    const error = req.query.error;
    req.session.authCode = code; //set it for this user

    if (error){
        return res.render('index', {
            message: "Error Connecting to Spotify"
        })
    }

    //authorize ourselves w/ that code
    //returns a promise w/ an access & refresh token
    spotifyApi.authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];
      const username = req.session.username;

      req.session.access_token = access_token; //store this user's accesss_token in cookies
      // console.log(username);

      db.query(`USE ${process.env.DATABASE};`);
      db.query("UPDATE users SET access_token = ? WHERE username = ?", [access_token, username], (error, results) => {
        if(error){
            console.log(error);
        }
    })
    db.query("UPDATE users SET authCode = ? WHERE username = ?", [code, username], (error, results) => {
        if(error){
            console.log(error);
        }
    })


      //set our access & refresh tokens for all future spotifyApi calls
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      // console.log(
      //   `Sucessfully retreived access token. Expires in ${expires_in} s.`
      // );

      //send users to index
      res.render('index', {
        message: "Successfully Connected to Spotify"
    })

    //when this access token expires, refresh it & update our cookies, etc
    setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
        req.session.access_token = access_token;
        db.query(`USE ${process.env.DATABASE};`);
        db.query("UPDATE users SET access_token = ? WHERE username = ?", [access_token, req.session.username], (error, results) => {
        if(error){
            console.log(error);
        }
    })
      }, expires_in / 2 * 1000);
      return spotifyApi.getMe();
    })
    .then(function(user) {
        console.log('Retrieved data for ' + user.body['display_name']);
        console.log('Email is ' + user.body.email);
        console.log('Image URL is ' + user.body.images[0].url);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
})

//if the user is logged in when they goto feed, render it for them with a welcome message.
app.get('/feed', (req, res) => {
    if (req.session.loggedin){
        res.render('feed', {
            name: req.session.name,
            username: req.session.username
        })
    }
    else {
        res.render('index', {
            message: "Please Log In"
        })
    }
    /// spotify api calls to see what friends are listening to
})


//explore page post request
app.post('/explore/search', (req, res) => {
    const search = req.body.search; //search term

    // is this necessary??
    var query = "select * from users where name = " + search + ";"; //find users that match their search
    var friendsResults;

    //find users whose name resembles their search query
    db.query(`USE ${process.env.DATABASE};`);
    db.query('SELECT * FROM users WHERE username LIKE ? AND username != ?', [search, req.session.username], async (error, results) => {
        // console.log(results);
        friendsResults = results;
        if(error){
            console.log(error);
        }

        const song = req.body.search;
        // console.log(song);

        //json obj in which to store song search results
        var songsObj = {
            songs: []
        };

        //ensure spotify knows we're auth'ed to access search
        spotifyApi.setAccessToken(req.session.access_token)


        //return top 5 tracks which resemble their search query
        spotifyApi.searchTracks(song, { limit: 5 })
            .then((data) => {
                data.body.tracks.items.forEach((item) => {

                    //store all of this track's artists
                    var artists = [];
                    item.artists.forEach((artist) => {
                        artists.push(artist.name);
                    })
                    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    //since we can't search artist by name...
                    //maybe we just display a track's artists, and give the user the option to
                    //add one of them to their top5????
                    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    // artists.push({
                    //     name: artist.name,
                    //     id: artist.id //potential workaround for not being able to search 'Doja Cat'?
                    // })

                    //store this song's name, its artists, and its link in songsObj. to be rendered into hbs
                    songsObj.songs.push({
                        songname: item.name,
                        artists: artists,
                        link: item.uri
                    })

                });
                // console.log(songsObj);
                if (results.length == 0){
                    res.render('explore', {
                        message: "No users with this username",
                        friends: null,
                        songs: songsObj["songs"]
                    })
                }
                else {
                    res.render('explore', {
                        message: null,
                        friends: friendsResults,
                        songs: songsObj["songs"]
                    })
                }

            })
            .catch((err) => {
                console.log(err);
            });

    });
});



//!!!!!!!!!!!!!!!!!!!!!!!!--------------------
//necessary endpoints to get working before demo

//------------queue functionality---------------
//--- create playlist for friend. name it, describe it
//------- add songs to it
//--- export a playlist that was made for you by a friend
//----------------------------------------------

//------------feed functionality?--------------
//--- when u add an artist/song to ur top 5, update all of ur friends' feeds
//------ that's pretty much it as far as i'm concerned
//---------------------------------------------

async function getTrackInfoFromSpotify(songid){
    var song = { };
    spotifyApi.getTrack(songid)
    .then((data) => {
        // console.log(data.body.name);
        song = {
            name: data.body.name,
            artist: data.body.artists,
            img: data.body.album.images[0].url
        };
    })
    console.log(song.name);
    return song;
}

//!!!!!!!!!!!!!!!!!!!!!!!!--------------------

//GET add a song to the user's top 5
app.get('/explore/add_song:songid/:location', async (req, res) => {
    // console.log(req.params.songid);

    var songid = req.params.songid; //given: a song id
    var songname;
    songid = songid.substring(14);
    var location = req.params.location;
    location = parseInt(location);
    var song;

    try {
        song = await getTrackInfoFromSpotify(songid);

    } catch(err) {
        console.log(err);
    }

    await new Promise(r => setTimeout(r, 2000));
    console.log("songname" + song.name);

    db.query(`USE ${process.env.DATABASE};`);
    switch(location) {
        case 1:
            db.query('UPDATE top5songs SET song_one = ? WHERE id = ?', [songid, req.session.userId], (error, results) => {
                if(error){
                    console.log(error);
                } else {
                    // console.log("here");
                    res.render('explore', {
                        message: songname + " was added to your Discography",
                        friends: null,
                        songs: []
                    });
                }
            });
          break;
        case 2:
            db.query('UPDATE top5songs SET song_two = ? WHERE id = ?', [songid, req.session.userId], (error, results) => {
                if(error){
                    console.log(error);
                } else {
                    // console.log("here");
                    res.render('explore', {
                        message: null,
                        friends: null,
                        songs: []
                    });
                }
            });
          break;
        case 3:
            db.query('UPDATE top5songs SET song_three = ? WHERE id = ?', [songid, req.session.userId], (error, results) => {
                if(error){
                    console.log(error);
                } else {
                    // console.log("here");
                    res.render('explore', {
                        message: null,
                        friends: null,
                        songs: []
                    });
                }
            });
            break;
        case 4:
            db.query('UPDATE top5songs SET song_four = ? WHERE id = ?', [songid, req.session.userId], (error, results) => {
                if(error){
                    console.log(error);
                } else {
                    // console.log("here");
                    res.render('explore', {
                        message: null,
                        friends: null,
                        songs: []
                    });
                }
            });
            break;
        case 5:
            db.query('UPDATE top5songs SET song_five = ? WHERE id = ?', [songid, req.session.userId], (error, results) => {
                if(error){
                    console.log(error);
                } else {
                    // console.log("here");
                    res.render('explore', {
                        message: null,
                        friends: null,
                        songs: []
                    });
                }
            });
            break;
      }

    // const song_name = req.params.songname //we should probably pass the songname too, for rendering purposes

    //db stuff here about connecting,
    //then inserting into their top5

//!!!!!!!!!!!!!!!!!!!!!!!!----------------------
// Pseudocode below

    //should we see if they have > 5 songs already?
    //then, if they don't...
    // res.render('explore', {
    //     message: song_name + " added to your top 5 songs.",
    //     friends: null,
    //     songs: []
    // });
    //if they do have > 5...
    // res.redirect('explore', {
    //     message: "Can't add " + song_name + ". Your top 5 is full!",
    //     friends: null,
    //     songs: []
    // });
})
//!!!!!!!!!!!!!!!!!!!!!!!!--------------------

//!!!!!!!!!!!!!!!!!!!!!!!!--------------------
//Pseudocode below
//GET add an artist to the user's top 5
//is this url fucked??
app.get('/explore/add_artist/:artistId/:artistName', (req,res) => {
    const artistid = req.params.artistId;
    const artistname = req.params.artistName;

    res.redirect('explore', {
        message: artistname + " added to your top 5 artists.",
        friends: null,
        songs: []
    })

    // if they have > 5 artists already...
    //     res.redirect('explore', {
    //         message: "Can't add " + artist_name + ". Your top 5 is full!",
    //         friends: null,
    //         songs:[]
    //     })
})
//!!!!!!!!!!!!!!!!!!!!!!!!--------------------

//GET friend request from user one to user two
app.get('/explore/friend-request-sent/:username/:userTwoId', (req, res) => {
    // console.log(req.params.username);
    // console.log(req.params.userTwoId);
    const userOneId = req.session.userId;
    const userTwoId = req.params.userTwoId;

    //reflect this request in these users' relationship
    db.query('INSERT INTO relationship SET ?', {user_id_one: userOneId, user_id_two: userTwoId, status: 0, action_user_id: userOneId }, (error, results) => {
            if(error){
                console.log(error);
                res.render('explore', {
                    message: "Error Sending Friend Request",
                    friends: null
                })
            } else {
                db.query('INSERT INTO queue SET ?', {fromUser: userOneId, toUser: userTwoId}, (error, results) => {
                    if(error){
                        console.log(error);
                    } else {
                        db.query('INSERT INTO queue SET ?', {fromUser: userTwoId, toUser: userOneId}, (error, results) => {
                            if(error){
                                console.log(error);
                            } else {
                                res.render('explore', {
                                    message: "Friend Request Sent to " + req.params.username
                                })
                            }
                        })
                    }
                })
            }
    })
})


//GET profile page
//render user information (spotify PF picture, username)
//conditionally render friend requests, friend lists, etc
app.get('/pfp', (req, res) =>{
    // collect top songs to render in page
    var songid;
    var songname, songname1, songname2;
    var ids = [];
    var songsObj = {
        songs: []
    };

    //Grab list of songs from our database
    db.query("SELECT * FROM top5songs WHERE id = ?", [req.session.userId], async (error, results) => {
        if(error) {
            console.log(error);
        } else {
            console.log("1st SongID in User " + req.session.userId + ": ");
            console.log("1: " + results[0].song_one);
            songname1 = results[0].song_one;
            songname2 = results[0].song_two;
            songname3 = results[0].song_three;
            songname4 = results[0].song_four;
            songname5 = results[0].song_five;
            let dataFromSpotify;
            try {
                dataFromSpotify = await getTracksFromSpotify(songname1, songname2, songname3, songname4, songname5);
                dataFromDB = await DBStuff();
            } catch(err) {
                console.log(err);
            }
            // try {
            //     dataFromDB = await DBStuff();
            // } catch(err) {
            //     console.log(err);
            // }
        }
    })

    async function getTracksFromSpotify(song_one_id, song_two_id, song_three_id, song_four_id, song_five_id) {

            if(song_one_id != null) {
                spotifyApi.getTrack(song_one_id)
                .then((data) => {
                    songname = data.body.name;
                    //store all of this track's artists
                    var artistsList = [];
                    data.body.artists.forEach((artist) => {
                        artistsList.push(artist.name);
                    })
                    songsObj.songs.push({
                        trackname: songname,
                        img: data.body.album.images[0].url,
                        artists: artistsList
                    })
                })
                .catch(function(err) {
                    console.log('Unfortunately, something has gone wrong.', err.message);
                });
            }
            if(song_two_id != null) {
                spotifyApi.getTrack(song_two_id)
                .then((data) => {
                    songname = data.body.name;
                    //store all of this track's artists
                    var artistsList = [];
                    data.body.artists.forEach((artist) => {
                        artistsList.push(artist.name);
                    })
                    songsObj.songs.push({
                        trackname: songname,
                        img: data.body.album.images[0].url,
                        artists: artistsList
                    })
                })
                .catch(function(err) {
                    console.log('Unfortunately, something has gone wrong.', err.message);
                });
            }
            if(song_three_id != null) {
                spotifyApi.getTrack(song_three_id)
                .then((data) => {
                    songname = data.body.name;
                    //store all of this track's artists
                    var artistsList = [];
                    data.body.artists.forEach((artist) => {
                        artistsList.push(artist.name);
                    })
                    songsObj.songs.push({
                        trackname: songname,
                        img: data.body.album.images[0].url,
                        artists: artistsList
                    })
                })
                .catch(function(err) {
                    console.log('Unfortunately, something has gone wrong.', err.message);
                });
            }
            if(song_four_id != null) {
                spotifyApi.getTrack(song_four_id)
                .then((data) => {
                    songname = data.body.name;
                    //store all of this track's artists
                    var artistsList = [];
                    data.body.artists.forEach((artist) => {
                        artistsList.push(artist.name);
                    })
                    songsObj.songs.push({
                        trackname: songname,
                        img: data.body.album.images[0].url,
                        artists: artistsList
                    })
                })
                .catch(function(err) {
                    console.log('Unfortunately, something has gone wrong.', err.message);
                });
            }
            if(song_five_id != null) {
                spotifyApi.getTrack(song_five_id)
                .then((data) => {
                    songname = data.body.name;
                    //store all of this track's artists
                    var artistsList = [];
                    data.body.artists.forEach((artist) => {
                        artistsList.push(artist.name);
                    })
                    songsObj.songs.push({
                        trackname: songname,
                        img: data.body.album.images[0].url,
                        artists: artistsList
                    })
                })
                .catch(function(err) {
                    console.log('Unfortunately, something has gone wrong.', err.message);
                });
            }
    }

    // console.log(req.session.access_token);
    // var user;
    async function DBStuff(){
        spotifyApi.setAccessToken(req.session.access_token)
        spotifyApi.getMe()
            .then(function(data) {
                // console.log(data.body.display_name);
                db.query(`USE ${process.env.DATABASE};`);
                db.query("SELECT relationship.user_id_one, users.username FROM relationship INNER JOIN users ON relationship.user_id_one = users.id \
                WHERE (user_id_one = ? OR user_id_two = ?) AND status = 0 AND action_user_id != ?", [req.session.userId, req.session.userId, req.session.userId], async (error, results) => {
                    if (error){
                        res.render('pfp', {
                            name: req.session.name,
                            username: req.session.username,
                            friend_requests: null,
                            user: data.body
                        })
                    } else {
                        console.log(results);
                        db.query("SELECT users.username FROM relationship INNER JOIN users ON IF(?=user_id_one, relationship.user_id_two = users.id, relationship.user_id_one = users.id) WHERE (user_id_one = ? OR user_id_two = ?) AND status = 1 \
                        ", [req.session.userId, req.session.userId, req.session.userId], async (error, friendsList) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log("songname when getting passed to hbs: " + songname);
                            res.render('pfp', {
                                name: req.session.name,
                                username: req.session.username,
                                friend_requests: results,
                                friends: friendsList,
                                user: data.body,
                                top5songs: songsObj["songs"]
                            });
                        }
                    })
                    }
                })
            })
            .catch(function(err) {
                console.log('Unfortunately, something has gone wrong.', err.message);
            });
        }
});


//GET user accepting friend requests
app.get('/pfp/accept-friend/:userOneId', (req, res) => {
    // console.log(req.params.userOneId);
    const signedInUser = req.session.userId;
    const friend = req.params.userOneId;
    db.query(`USE ${process.env.DATABASE};`);

    //update their relationship in the relationship table
    db.query("UPDATE relationship SET status = 1, action_user_id = ? WHERE user_id_one = ? AND user_id_two = ?",
        [signedInUser, friend, signedInUser], async (error, results) => {
            if (error){
                console.log(error);
                res.redirect('/pfp');
            }
            else {
                res.redirect('/pfp');
            }
    })
})


app.get("/export-queue", (req, res) => {
    const friendID = req.query["friendID"];
    var friend;
    var songsObj = {
        songs: []
    };
    db.query("SELECT username FROM users WHERE id = ?", [friendID], (error, currentFriend) => {
        if(error){
            console.log(error);
        } else {
            friend = currentFriend[0].username;
        }
    })

    db.query("SELECT * FROM queue WHERE toUser = ? AND fromUser = ?", [req.session.userId, friendID], (error, results) => {
        // console.log(results);
        if (results[0].nameOfPlaylist == null){
            // User does not have a playlist, We need to make one

            res.render("queue", {
                message: friend + " hasn't made you a queue yet",
                theirQueue: false,
                friendName: friend,
                friendID: friendID
            })
            console.log('got here, id is null');
        } else {
            // User has a playlist already for this friend
            // console.log("select friend" + selectedFriend);

            db.query("SELECT songID FROM queueSongs WHERE fromUser = ? AND toUser = ?", [friendID, req.session.userId], async (error, result) => {
                if(error){
                    console.log(error);
                } else {
                    songsArr = result.map((song) => {
                        return { id: song.songID };
                    });
                    if(songsArr == null){
                        res.render("queue", {
                            message: friend + " hasn't made you a queue yet",
                            theirQueue: false,
                            friendName: friend,
                            friendID: friendID
                        })
                    } else {
                        var songCounter = 0;
                        spotifyApi.setAccessToken(req.session.access_token)
                        songsArr.forEach((song) => {
                            console.log(song.id);
                            spotifyApi.getTrack(song.id)
                            .then((data) => {
                                    songCounter++;
                                    //store all of this track's artists
                                    var artists = [];
                                    data.body.artists.forEach((artist) => {
                                        artists.push(artist.name);
                                    })

                                    //store this song's name, its artists, and its link in songsObj. to be rendered into hbs
                                    songsObj.songs.push({
                                        songname: data.body.name,
                                        artists: artists,
                                        link: data.body.uri
                                    })
                                    if(songCounter == songsArr.length){
                                        renderOurPage();
                                    }
                            })
                        })
                    }
                }
            })

        }
    })
    async function renderOurPage(){
        res.render("queueExport", {
            message: null,
            friendName: friend,
            friendID: friendID,
            songs: songsObj["songs"]
        })
    }
})

app.get("/export-queue-to-spotify", (req, res) => {
    const friendID = req.query["friendID"];
    var playlistID;
    var songsArr;

    db.query("SELECT nameOfPlaylist FROM queue WHERE toUser = ? AND fromUser = ?", [req.session.userId, friendID], (error, playlistName) => {
        if(error){
            console.log(error);
        } else {
            console.log("1");
            spotifyApi.createPlaylist(playlistName[0].nameOfPlaylist, { description: 'Made with Vynilla <3', public: true })
            .then((data) => {
                playlistID = data.body.id;
                console.log("2");
                db.query("SELECT songID FROM queueSongs WHERE fromUser = ? AND toUser = ?", [friendID, req.session.userId], (error, songIDs) => {
                    songsArr = songIDs.map((song) => {
                        return "spotify:track:" + song.songID;
                    });
                    console.log(songsArr);
                    spotifyApi.addTracksToPlaylist(playlistID, songsArr)
                    .then((finished) => {
                        console.log("2");
                        res.render("queueExport", {
                            message: "Your queue has been exported!"
                        })
                    })
                })
            })
        }
    })
})

app.get("/queue", (req, res) => {
    var friends = [];

    db.query("SELECT users.username, users.id FROM relationship INNER JOIN users ON IF(?=user_id_one, relationship.user_id_two = users.id, relationship.user_id_one = users.id) WHERE (user_id_one = ? OR user_id_two = ?) AND status = 1 \
    ", [req.session.userId, req.session.userId, req.session.userId], (error, friendsList) => {
    if (error) {
        console.log(error);
    } else {
        console.log(friendsList[0]);
        for (var i = 0; i < friendsList.length; i++){
            friends.push(friendsList[i]);
        }
        res.render("queue", {
            friends: friends,
            export: true
        })
    }
})


    // db.any(getAllUsers)
    //     .then((data) => {
    //         // console.log("select person from users:");
    //         // console.table(data);
    //         data.forEach((person) => {
    //             users.push(person.person);
    //         });

    //         // console.log('\n users array:');
    //         // console.table(users);
    //         res.render("queue", { users: users, message: "in /queue, all working well" });
    //     })
    //     .catch((err) => {
    //         console.error(err);
    //         res.render("queue", { message: "messed up somewhere in /queue" });
    //     });
});


app.get("/select-friend", (req, res) => {
    var friend;
    const selectedFriend = req.query["friends-dropdown"];
    var songsArr = [];
    var songsObj = {
        songs: [],
    };

    db.query("SELECT username FROM users WHERE id = ?", [selectedFriend], (error, currentFriend) => {
        if(error){
            console.log(error);
        } else {
            friend = currentFriend[0].username;
        }
    })

    db.query("SELECT * FROM queue WHERE fromUser = ? AND toUser = ?", [req.session.userId, selectedFriend], (error, results) => {
        console.log(results);
        if (results[0].nameOfPlaylist == null){
            // User does not have a playlist, We need to make one

            res.render("queue", {
                message: "No Queue",
                theirQueue: false,
                friendName: friend,
                friendID: selectedFriend
            })
            console.log('got here, id is null');
        } else {
            // User has a playlist already for this friend
            // console.log("select friend" + selectedFriend);

            db.query("SELECT songID FROM queueSongs WHERE fromUser = ? AND toUser = ?", [req.session.userId, selectedFriend], async (error, result) => {
                if(error){
                    console.log(error);
                } else {
                    songsArr = result.map((song) => {
                        return { id: song.songID };
                    });
                    if(songsArr == null){
                        res.render("queue", {
                            message: "Making a queue for " + friend,
                            theirQueue: true,
                            friendName: friend,
                            friendID: selectedFriend,
                            songs: null
                        })
                    } else {
                        var songCounter = 0;
                        spotifyApi.setAccessToken(req.session.access_token)
                        songsArr.forEach((song) => {
                            console.log(song.id);
                            spotifyApi.getTrack(song.id)
                            .then((data) => {
                                    songCounter++;
                                    //store all of this track's artists
                                    var artists = [];
                                    data.body.artists.forEach((artist) => {
                                        artists.push(artist.name);
                                    })

                                    //store this song's name, its artists, and its link in songsObj. to be rendered into hbs
                                    songsObj.songs.push({
                                        songname: data.body.name,
                                        artists: artists,
                                        link: data.body.uri
                                    })
                                    if(songCounter == songsArr.length){
                                        renderOurPage();
                                    }
                            })
                        })
                    }
                }
            })

        }
    })
    async function renderOurPage(){
        res.render("queue", {
            message: "Making a queue for " + friend,
            theirQueue: true,
            friendName: friend,
            friendID: selectedFriend,
            songs: songsObj["songs"]
        })
    }

})





app.get("/make_queue", (req, res) => {
    const friendID = req.query["friendID"];
    console.log("makequeue" + friendID);
    const queueName = req.query["queue_name"];
    const friendName = req.query["friendName"];

    db.query("UPDATE queue SET nameOfPlaylist = ? WHERE fromUser = ? AND toUser = ?", [queueName, req.session.userId, friendID], (error, result) => {
        if(error){
            console.log(error);
        } else {
            res.render("queue", {
                message: "You made a queue for " + friendName,
                theirQueue: true,
                friendID: friendID,
                friendName: friendName
            })
        }

    })
})

app.get("/search", (req, res) => {
    const songname = req.query["songname"];
    const friendName = req.query["friendName"];
    const friendID = req.query["friendID"];
    var songsObj = {
        songs: [],
    };
    spotifyApi.setAccessToken(req.session.access_token)
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

            // console.log(songsObj["songs"]);
            res.render("queue", {
                songsFromSearch: songsObj["songs"], //obvi we need to get this from DB
                queueSoFar: songsObj["songs"], //& this
                friendName: friendName,
                friendID: friendID
            });
})
});

app.get("/addToPlaylist", (req, res) => {
    var song = req.query["songLink"];
    const friendID = req.query["friendID"];
    var friendName;
    song = song.substring(14);

    var songsObj = {
        songs: []
    };

    db.query("SELECT username FROM users WHERE id = ?", [friendID], (error, result) => {
        if(error){
            console.log(error);
        } else {
            friendName = result[0].username;
        }
    })

    db.query("INSERT INTO queueSongs (fromUser, toUser, songID) VALUES (?, ?, ?)", [req.session.userId, friendID, song], (error, results) => {
        if(error){
            console.log(error);
        } else {
            db.query("SELECT songID FROM queueSongs WHERE fromUser = ? AND toUser = ?", [req.session.userId, friendID], async (error, result) => {
                if(error){
                    console.log(error);
                } else {
                    songsArr = result.map((song) => {
                        return { id: song.songID };
                    });
                    if(songsArr == null){
                        res.render("queue", {
                            message: "We should never get here",
                            theirQueue: true,
                            friendName: friend,
                            friendID: selectedFriend,
                            songs: null
                        })
                    } else {
                        var songCounter = 0;
                        spotifyApi.setAccessToken(req.session.access_token)
                        songsArr.forEach((song) => {
                            console.log(song.id);
                            spotifyApi.getTrack(song.id)
                            .then((data) => {
                                    songCounter++;
                                    //store all of this track's artists
                                    var artists = [];
                                    data.body.artists.forEach((artist) => {
                                        artists.push(artist.name);
                                    })

                                    //store this song's name, its artists, and its link in songsObj. to be rendered into hbs
                                    songsObj.songs.push({
                                        songname: data.body.name,
                                        artists: artists,
                                        link: data.body.uri
                                    })
                                    if(songCounter == songsArr.length){
                                        renderOurPage();
                                    }
                            })
                        })
                    }
                }
            })
        }
    })
    async function renderOurPage(){
        res.render("queue", {
            message: "Making a queue for " + friendName,
            theirQueue: true,
            friendName: friendName,
            friendID: friendID,
            songs: songsObj["songs"]
        })
    }
})

//LATER IMPLEMENTATION
/////////////////////////////////////////

// sends back the queue of the selected friend on the profile page
//
// ya this is nice, i think we want to pass in the name of the friend they select too
// so i added that param in the get query
// --jared
app.get("/friendSelect/:whichFriend" , (req, res) => {
    const friendName = req.query.whichFriend;
    //db.query(queueofFriend);
    //becomes
    //db.query(queue belonging to relationship b/w me & friendName)
    // var queue = {
    //     queue_song : {
    //         sentFrom: '',
    //         name = '',
    //         artist = ''
    //     }
    // }
    res.redirect('pfp', {
        queue_song: queue
    });
})

// following three methods let user reset their TOP choices
//
// i like it, but presumably, we want them to be able to choose which things to remove,
// so i added params to the get link thing.
// since we only have topsong1, topsong2... topsong 5, this shouldn't be that bad
// --jared
app.get("/removeSongs/:toRemove" , (req, res) => {
    const getRidOfSong = req.query.toRemoveSong; //num b/w one and 5, based on which 'x' they pressed on the pfp
    db.query('DELETE FROM top5songs WHERE id = ? AND song_one = ? OR song_two = ? OR song_three = ? OR song_four = ? OR song_five = ?', [req.session.userId, getRidOfSong], async(error, results) => {
        if(error) {
            console.log(error);
        }
    })
    res.redirect('pfp');
})

//i'm imagining something similar will go on with these two,
//since i don't think they'd always want to entirely clear their top 5s
app.get("/removeArtists/:toRemove" , (req, res) => {
    const getRidOfArtist = req.query.toRemoveArtist;
    db.query('DELETE FROM top5artists WHERE id = ? AND artist_one = ? OR artist_two = ? OR artist_three = ? OR artist_four = ? OR artist_five = ?', [req.session.userId, getRidOfArtist], async(error, results) => {
        if(error) {
            console.log(error);
        }
    })
    res.redirect('pfp');
})

app.listen( process.env.PORT || 3333, () => {
    console.log("Server Started on http://localhost:3333")
})
