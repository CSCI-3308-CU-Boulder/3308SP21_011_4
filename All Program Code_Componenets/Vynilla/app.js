const express = require("express");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var session = require('express-session');
const SpotifyWebApi = require('spotify-web-api-node');

dotenv.config({ path: './.env'});

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

const app = express();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: "nodejs_login"
});

const spotifyApi = new SpotifyWebApi({
    redirectUri: 'http://localhost:8888/callback', //where auth will send the user to after they give us permission. not really relevant for this example, since everything displays in the terminal
    clientId: '1721ccaf9f0f40a196710dede9030908', //our app details
    //shouldn't be putting these on github but ¯\_(ツ)_/¯
    clientSecret: '7efbade01f16446a880254fe1f30d2a7'
});


db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL Connected...")
    }
})

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// parse application/x-www-form-urlencoded, basically can only parse incoming Request Object if strings or arrays
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set('view engine', 'hbs');

//Define Routes
app.use('/', require('./routes/pages.js'));
app.use('/auth', require('./routes/auth'));

app.get('/connect-spotify', (req, res) => {
    return res.redirect(spotifyApi.createAuthorizeURL(scopes));
})

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    req.session.authCode = code;
    if (error){
        return res.render('index', {
            message: "Error Connecting to Spotify"
        })
    }
    spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      req.session.access_token = access_token;
      const username = req.session.username;
      console.log(username);
      db.query('USE nodejs_login;');
      db.query("UPDATE users SET access_token = ? WHERE username = ?", [access_token, username], (error, results) => {
        if(error){
            console.log(error);
        }
    })

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      // console.log(data.body);

      // console.log('access_token:', access_token);
      // console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.render('index', {
        message: "Successfully Connected to Spotify"
    })

    setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
        req.session.access_token = access_token;
        db.query('USE nodejs_login;');
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

app.get('/feed', (req, res) => {
    if (req.session.loggedin){
        // console.log(req.session);
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
})


app.post('/explore/search', (req, res) => {
    const search = req.body.search;
    var query = "select * from users where name = " + search + ";";
    var friendsResults;
    // First we search users
    db.query('USE nodejs_login;');
    db.query('SELECT * FROM users WHERE name LIKE ? AND username != ?', [search, req.session.username], async (error, results) => {
        console.log(results);
        friendsResults = results;
        if(error){
            console.log(error);
        }

        // Now we search a song
        const song = req.body.search;
        // const playlistid = req.query["playlistid"];
        console.log(song);

        var songsObj = {
            songs: []
        };


        //after 
        spotifyApi
            .setAccessToken(req.session.access_token)
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
                console.log(songsObj);
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

                //pass the songs returned from the call & playlistid back to the hbs
                // res.render('explore', {songs: songsObj["songs"], message: null, friends: friendsResults});
            })
            .catch((err) => {
                console.log(err);
            });

    });
});

app.get('/explore/add_song:songid', (req, res) => {
    console.log(req.params.songid);
    
    // res.redirect('explore');
})

app.get('/explore/friend-request-sent/:username/:userTwoId', (req, res) => {
    console.log(req.params.username);
    console.log(req.params.userTwoId);
    const userOneId = req.session.userId;
    const userTwoId = req.params.userTwoId;
    db.query('INSERT INTO relationship SET ?', {user_id_one: userOneId, user_id_two: userTwoId, status: 0, action_user_id: userOneId }, (error, results) => {
            if(error){
                console.log(error);
                res.render('explore', {
                    message: "Error Sending Friend Request",
                    friends: null
                })
            } else {
                res.render('explore', {
                    message: "Friend Request Sent to " + req.params.username
                })
            }
    })
})


app.get('/pfp', (req, res) =>{

    var user;
    console.log(req.session.access_token);
    spotifyApi
        .setAccessToken(req.session.access_token)
    spotifyApi
        .getMe()
        .then(function(data) {
            console.log(data.body.display_name);
            db.query('USE nodejs_login;');
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
                        res.render('pfp', {
                            name: req.session.name,
                            username: req.session.username,
                            friend_requests: results,
                            friends: friendsList,
                            user: data.body
                        });
                    }
                })
                }
            })
        })
        .catch(function(err) {
            console.log('Unfortunately, something has gone wrong.', err.message);
        });
});

app.get('/pfp/accept-friend/:userOneId', (req, res) => {
    console.log(req.params.userOneId);
    const signedInUser = req.session.userId;
    const friend = req.params.userOneId;
    db.query('USE nodejs_login;');
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


app.listen(8888, () => {
    console.log("Server Started on http://localhost:8888")
})
