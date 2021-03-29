const express = require("express");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var session = require('express-session');

dotenv.config({ path: './.env'});

const app = express();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE
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

app.get('/feed', (req, res) => {
    if (req.session.loggedin){
        console.log(req.session);
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
    // console.log(query);
    db.query('USE nodejs_login;');
    db.query('SELECT * FROM users WHERE name LIKE ?', [search], async (error, results) => {
        console.log(results);
        if(error){
            console.log(error);
        }
        if (results.length == 0){
            res.render('explore', {
                message: "No users with this username",
                friends: null
            })
        }
        else {
            res.render('explore', {
                message: null,
                friends: results
            })
        }
    });
});

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
    console.log(req.session.userId);
    db.query('USE nodejs_login;');
    db.query("SELECT relationship.user_id_one, users.username FROM relationship INNER JOIN users ON relationship.user_id_one = users.id \
    WHERE (user_id_one = ? OR user_id_two = ?) AND status = 0 AND action_user_id != 1", [req.session.userId, req.session.userId], async (error, results) => {
        if (error){
            res.render('pfp', {
                name: req.session.name,
                username: req.session.username,
                friend_requests: null
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
                    friends: friendsList
                });
            }
        })
        }
    })
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

app.listen(5000, () => {
    console.log("Server Started on Port 5000")
})