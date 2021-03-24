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
const token = 'BQBnjJyRRFHeGTg59o08DcKrqag5CpoCcxNcN4RbRRX6HgScgxlgVeuVTO4y8UoMjQGBRHQQ-8MGGUST7sAa6ONQ1PZUdI_QqwQG1T0fdO3IGd87qGNOukVMhCi377v07aaMqgWMAfib1axQV0AtsvWDi0JSAhCSSC0w_nqrqtfU9jXTrehdrcfTW_8SRtCwe1UDbdGGC7YVMB1kGBkSISM56KlOvk7kfiUdfqhaTdLAbmhRHh1IFplMEjJAe3Sw2Jq9zR9OY3_99NI1--Cf3SWlLmtxN3_-MdklzD9le46JgHyOkfi5'
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
