const SpotifyWebApi = require('spotify-web-api-node');
const spapi = require('spotify-web-api-node');

//gotta auth token from index.js.
//1. run 'node index' in terminal
//2. goto the localhost it opens
//3. auth vynilla
//4. authorization token should appear in the terminal
//5. put in this string
//6. 'node getSong'
//7. :D
const token = 'BQCVfl5bSWEuYNXEjJWJKzDND2zyvgtkbKkTYKM63vbtsjOD3nBiQllAGRO-rz8Bgco63e4RwOCq_HfRId-YIZ9wHr59fZhKDIuex2WBi9bAsl93E06XLQY8T4BDyWJDIkrbJIHuKZXyC6-JxxjRlZepDjGeXx1krQgL9o8uhP6ZD0a0IB0BJ0sKSJcCJLEQbjjY7TmmSlKG7JcdttociMSPiKwhRUlM2sJg1c8PzPTQABwTHVlA1dNp4ZJq7wNckedPyRLZhU0-MNdig64m_6NxKgopJi62j7uQkh83er426z_VsvV-'
//token *shouldn't* be stored in browser (cookies), but alas... we won't get docked for it if we do that

const spot = new SpotifyWebApi();
spot.setAccessToken(token);

function songs() {
    (async () => {
        const me = await spot.getMyCurrentPlayingTrack();
        console.log(me.body);
        console.log(me.body.item.artists)
    })
        ().catch(e => {
            console.error(e);
    })
}


songs();
