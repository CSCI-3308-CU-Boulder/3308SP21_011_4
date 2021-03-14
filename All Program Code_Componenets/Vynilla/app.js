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
    database: "nodejs_login"
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
    console.log("hi");
    if (req.session.loggedin){
        res.render('feed', {
            name: req.session.name
        })
    }
})

app.listen(5000, () => {
    console.log("Server Started on Port 5000")
})