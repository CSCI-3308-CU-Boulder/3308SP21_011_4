const express = require("express");
const router = express.Router();

router.get('/', (req, res) =>{
    res.render('index');
});

router.get('/register', (req, res) =>{
    res.render('register');
});

router.get('/explore', (req, res) =>{
    res.render('explore');
});

router.get('/pfp', (req, res) =>{
    res.render('pfp', {
        name: req.session.name,
        username: req.session.username
    });
});

module.exports = router;