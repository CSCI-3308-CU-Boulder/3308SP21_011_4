// this program will update the html on the profile page based on the database
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
var session = require('express-session');
var pgp = require('pg-promise')();

dotenv.config({ path: './.env'});

<script src="jquery-3.5.1.min.js"></script>


// is mysql specified?
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: "nodejs_login"
});

db.connect((error) => {
	if(error){
		console.log(error);
	} else {
		console.log("mySQL connected ...");
	}
})

/*
const friends_table = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: "nodejs_login"
});
*/

/*
friends_table.connect((error) => {
	if(error){
		console.log(error);
	} else {
		console.log("mySQL connected ...");
	}
})
*/


// store in cookie (our own id, spotify id, username?)
// retrieve all user info and send to profile page
app.get('/Vynilla/profile', function(req, res) {

	//each where will use WHERE id = ' '; 
	var alluserInfo =  'select * from users WHERE user =' + req.session.username + ';';
    var name =         'select name from users WHERE user =' + req.session.username + ';'; // is this correct search? user cookie
    var pfplink =      'select pfplink from users WHERE user =' + req.session.username + ';';
    var top_songs =    'select songs from users WHERE user =' + req.session.username + ';';
    var top_albums =   'select albums from users WHERE user =' + req.session.username + ';';
    var top_artists =  'select artists from users WHERE user =' + req.session.username + ';';
	//var friend_count = 'select count from friends WHERE user =' + req.session.username + ';';
	//var friends_list = 'select * from friends WHERE user =' + req.session.username + ';';
    
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
				display_name: req.session.username, // is this username in cookie?
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
				display_name: '',
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
	// user jquery?
	var friend = document.getElementById()
    
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