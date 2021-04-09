const express = require('express');
const spot = require('spotify-web-api-node');

const app = express();

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('find_song.ejs', {
        song: {
            name: "Jared"
        }
    });
});

app.listen(8080);
console.log('8080 is the magic port xD');
