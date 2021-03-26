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

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: "nodejs_login"
});


// store in cookie (our own id, spotify id, username?)
//  send profile picture and display_name
app.get('/Vynilla/profile', function(req, res) {
    var friends_count = "";
    var friends_list = "";
    var name = "";
    var pfplink = "";
    var queue = "";
    var top_songs = "";
    var top_albums = "";
    var top_artists = "";
    
	db.task('get-everything', task => {
		return task.batch([
			task.any(name),
			task.any(pfplink),
            task.any(friends_count),
            task.any(top_artists),
            task.any(top_songs),
            task.any(top_albums),
            task.any(queue),
            task.any(friends_list)
		]);
	})
		.then(info => { // use info as array name
			res.render('pages/home',{
				my_title: "Home Page",
				data: "", // first db query result
				color: "",
				color_msg: info[1][0].color_msg // why is this 2d array and why .color_msg
			})
		})
		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});

});


// this post will take in the user selected friend, then return the queue from that user
app.post('/Vynilla/profile', function(req, res) {
	var friends_list = req.query.friend_select; // drop down element id="friend_select"
    
	db.task('get-everything', task => {
		task.query(friends_list)
	})
		.then(info => { // use info as array name
			res.render('pages/home',{
				my_title: "Home Page",
				data: "", // first db query result
				color: "",
				color_msg: info[1][0].color_msg // why is this 2d array and why .color_msg
			})
		})
		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});

});

app.listen(8888, console.log("Okokok, goto http://localhost:8888/login !"));