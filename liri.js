require("dotenv").config();

var keys = require("./keys.js");

var Spotify = require('node-spotify-api');
var Twitter = require('twitter');

var spotify = new Spotify(keys.spotify);
var client = new Twitter(keys.twitter);

var firstArg = process.argv[2];
var secondArg = process.argv[3];

// console.log(spotify);
// console.log(client);

//  POST TO TWITTER
// client.post('statuses/update', {status: 'It is tha trizzooth!'}, function(error, tweet, response) {
//   if(error) throw error;
//   console.log(tweet);
//   console.log(response);
// });

if (firstArg === 'new-tweet') {
  client.post('statuses/update', { status: secondArg }, function (error, tweet, response) {
    if (error) throw error;
    console.log(tweet);
  });
}

else if (firstArg === `my-tweets`) {
  // console.log() last twenty tweets
  client.get('favorites/list', function (error, tweet, response) {
    // console.log(tweet);
    console.log(response);
  });
} else if (firstArg === `spotify-this-song`) {
  if (/* song provided */ true) {
    // log song info to terminal/bash (Artist, the song's name, a preview link of the song from Spotify, the album the song is from)
    console.log("Song info.");
  }
  else {
    // if no song provided, default to "The Sign" by Ace of Base
    console.log("Default Song info.");
  }
} else if (firstArg === `movie-this`) {
  if (/* movie input valid*/ true) {
    // if use movie input is valid, output movie info to terminal/bash (Title, Year, IMDB Rating, Rotten Tomatoes rating, Country where it wsa produced, Language it's in, Plot, Actors in it)
    console.log("Movie info.");
  } else {
    // if no movie input, output data for 'Mr. Nobody' along with the messages "If you haven't watched 'Mr. Nobody,' then you should: http://www.imdb.com/title/tt0485947/" and "It's on Netflix!"
    console.log("Mr. Nobody movie info.");
  }
} else if (firstArg === `do-what-it-says`) {
  // this uses the fs Node package to take the text inside random.txt and use to call one of Liri's commands. Right now, it's set to run 'spotify-this-song' for "I want it that way"
  // Feel free to change random.txt to whatever you want.
  console.log("random text file instruction result.");
} else {
  // error handling
  console.log("You ran an invalid command.");
}