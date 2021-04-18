# 3308SP21_011_4

Vynilla is a web-based, music centered social media platform to showcase your music taste and discover new music in a world of music listeners. Vynilla will link to user's Spotify account to use and manipulate their account (eg. adding music playlists). Users will be able to showcase their favorite songs to their friends in any order of their chosing. Users will be able to reccomend and send music to their friends to listen to in the form of a queue. These queues can be modified at any time by the sender and exported at any time by the receiver to Spotify to a brand new playlist. 


# Usage
Vynilla is fun with friends!
Once the queue is exported, go to your Spotify account and look for it under playlists.
If the website happens to crash, restart the heroku app. On a good note, database information persists across crashes!

1. go to: http://vynilla-app.herokuapp.com/
2. click "Sign up", and register and account with a secure password.
3. Authorize your Spotify account with Vynilla.
4. Sign in
5. Go to explore and send a friend request to friend that you are using Vynilla with.
6. Search your favorite songs on the explore page, and add them to different spots in your Discography
* You can view these songs on your profile page.
7. Go to the queue page (first click on "home" then click on "queue")
8. make a queue of songs for your friend (first name the queue, this will be the playlist name in Spotify)
9. You can select a friend who has made queue for your and view it on the page. This can be exported to Spotify by clicking the export button.



# Repo organization
* app.js is main javascript file
* .env is all database settings
* /routes/auth.js is all express settings 
* session cookie is /controllers/auth.js
* Main profile page is pfp.hbs
* views, stylesheets are our HTML and CSS files

Misc.
- Milestones, meetings, etc. are in /Class Materials
- Spotify API examples are in... you guessed it, /Spotify_API_Examples
- Stylesheets, etc. are in /public
- Some SQL resources are in /SQL
- Old code (before Heroku push restructuring) is in /legacy code
... etc.


Thanks, and have a great day :D <3
