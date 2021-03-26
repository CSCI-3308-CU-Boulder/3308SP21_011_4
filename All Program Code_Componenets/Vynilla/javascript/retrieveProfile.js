// this program will update the html on the profile page based on the database

var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var session = require('express-session');
var pgp = require('pg-promise')();


// is mysql specified?
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: "nodejs_login"
});

const friends_table = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: "nodejs_login"
});


// store in cookie (our own id, spotify id, username?)
// retrieve all user info and send to profile page
app.get('/Vynilla/profile', function(req, res) {

	//each where will use WHERE id = ' '; 
    var name = "";
	var friend_count = "";
    var pfplink = "";
    var top_songs = "";
    var top_albums = "";
    var top_artists = "";
	var friends_list = "";
    
	db.task('get-everything', task => {
		return task.batch([
			task.any(name),
			task.any(friend_count),
			task.any(pfplink),
            task.any(top_artists),
            task.any(top_songs),
            task.any(top_albums),
            task.any(friends_list)
		]);
	})
		.then(info => { // use info as array name // does it matter that return types have same name as query vars?
			res.render('/Vynilla/profile',{
				display_name: session.Cookie.username,
				name: info[0],
				friend_count: info[1],
				profile_link: info[2],
				top_artists: info[3],
				top_songs: info[4],
				top_albums: info[5],
				friends_list: info[6]
			})
		})
		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			response.render('/Vynilla/profile', {
				display_name: session.Cookie.username,
				name: '',
				friend_count: '',
				profile_link: '',
				top_artists: '',
				top_songs: '',
				top_albums: '',
				friends_list: ''
			})
		});

});


// this post will take in the user selected friend, then return the queue from that user
app.post('/Vynilla/profile', function(req, res) {
	var friend = req.query.friend_select; // drop down element id="friend_select"
    
	friends_table.task('get-everything', task => {
		task.query(friend)
	})
		.then(info => { // use info as array name
			res.render('/Vynilla/profile', {
				queue: info[0]
			})
		})
		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			response.render('/Vynilla/profile', {
				queue: ''
			})
		});

});

app.listen(8888, console.log("Okokok, goto http://localhost:8888/login !"));