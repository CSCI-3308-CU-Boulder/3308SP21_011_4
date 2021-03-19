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
const token = 'BQDzI6Gr2X8974lfFeFvLoM-cdeIx-oKnpyLXfiZb4IiKPGvcsG4iMeBmuzBaehz5Nq6jWDjaDl8FyqGuXKARUFEeRqkFCCouyI6sILtfJtS1m7WyJeLZGSs-u6hAOVR99scdhTrQ4N73qG0N36VXGVXXw0HGb_Ls4JliSsHINg27iHQztw-7BemtVc2gVZoloxVGZQJkl_2Y-84LMmRLO4oxSFkuMDbOrUB33Lg8wmv8MXyR8c5PgPmS-U3qKJduS7W_C34oX3UbInd6JMOOVOWFRHAxvB7AgLzLoUvWMVf3HwAUC1u'

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