const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var session = require('express-session');
const SpotifyWebApi = require('spotify-web-api-node');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: 'heroku_520f5c0c9f5c6e8'
});

exports.register = (req, res) => {

    console.log(req.body);

    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const confirmPass = req.body.confirmPass;

    req.session.name = name;
    req.session.email = email;
    req.session.username = username;

    if (!name || !email || !username || !password || !confirmPass){
        return res.render('register', {
            message: "Fields cannot be blank"
        })
    }
    db.query(`USE heroku_520f5c0c9f5c6e8;`);
    db.query('SELECT username FROM users WHERE username = ?', [username], async (error, results) => {
        if(error){
            console.log(error);
        } 
        if( results.length > 0 ){
            return res.render('register', {
                message: "Username is already taken"
            })
        }
        else if (password !== confirmPass){
            return res.render('register', {
                message: "Passwords do not match"
            })
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query("INSERT INTO users SET ?", {name: name, email: email, username: username, password: hashedPassword }, (error, results) => {
            if(error){
                console.log(error);
            } else {
                db.query("SELECT id FROM users WHERE username = ?", [username], (error, results) => {
                    if(error){
                        console.log(error);
                    } else {
                        const currentUserID = results[0].id;
                        db.query("INSERT INTO top5songs (id) VALUES(?);", [currentUserID], (error, results) => {
                            if(error){
                                console.log(error);
                            } else {
                                return res.redirect('/connect-spotify');
                                
                            }
                        })
                    }
                })
            }
        })

    });

    
    // res.send("Form Submitted");
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if( !email || !password ){
            return res.status(400).render('index', {
                message: "Fields cannot be blank"
            })
        }

        db.query("SELECT * FROM users WHERE email = ?", [email], async (error, results) => {
            if (!results[0] || !(await bcrypt.compare(password, results[0].password))){
                res.status(401).render('index', {
                    message: "Email or password is incorrect"
                })
            } else {
                const id = results[0].id;

                req.session.loggedin = true;
                req.session.name = results[0].name;
                req.session.username = results[0].username;
                req.session.email = results[0].email;
                req.session.userId = results[0].id;
                req.session.access_token = results[0].access_token;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie("jwt", token, cookieOptions);
                res.status(200).redirect('/feed');
            }
        })


    } catch(error) {
        console.log(error);
    }
}