require("dotenv").config();

var keys = require("./keys.js");
var request = require("request");
var fs = require("fs");
var inquirer = require("inquirer");

var Spotify = require('node-spotify-api');
var Twitter = require('twitter');

var spotify = new Spotify(keys.spotify);
var client = new Twitter(keys.twitter);

var notMyTweets = ["Cmdr_Hadfield", "neiltyson", "BillNye", "BillGates", "elonmusk", "SpaceX", "NASA", "NASAHubble", "jensimmons", "rachelandrew", "puscifer", "mjkeenan"];

inquirer.prompt([
  {
    type: "list",
    message: "Pick one:",
    choices: ["new-tweet", "get-tweets", "spotify-this-song", "movie-this", "do-what-it-says"],
    name: "Action"
  }
]).then((response) => {
  newLiri(response.Action);
});

function newLiri(p1, p2) {
  if (p1 === "new-tweet") {
    inquirer.prompt([
      {
        type: "input",
        message: "What would you like to tweet?",
        name: "Tweet"
      }
    ])
      .then((response) => {
        client.post('statuses/update', { status: response.Tweet }, (error, tweet, response) => {
          if (error) console.log(error);
          console.log(tweet.text);
        });
      });
  }
  else if (p1 === "get-tweets") {
    inquirer.prompt([
      {
        type: "list",
        message: "Whose tweets?",
        choices: ["My tweets", "Someone else's tweets", "You pick"],
        name: "Whose_tweets"
      }
    ])
      .then((response) => {
        if (response.Whose_tweets === 'Someone else\'s tweets') {
          inquirer.prompt([
            {
              type: "input",
              message: "Whose tweets do you want to see?",
              name: "Not_your_tweets"
            }
          ])
            .then((response) => {
              var searchName = response.Not_your_tweets;
              var ownerName = response.Not_your_tweets + "'s";
              getTweets(searchName, ownerName);
            });
        }
        else if (response.Whose_tweets === "You pick") {
          var randomNumber = Math.floor(Math.random() * (notMyTweets.length));
          var randomPerson = notMyTweets[randomNumber];
          var whoseTweets = notMyTweets[randomNumber] + "'s";
          getTweets(randomPerson, whoseTweets);
        }
        else {
          getTweets(null, "My");
        }
      })
  }
  else if (p1 === "spotify-this-song") {
    if (p2) {
      spotify.search({ type: 'track', query: p2, limit: 1 }, (error, data) => {
        getSongInfo(error, data);
      });
    }
    else {
      inquirer.prompt([
        {
          type: "input",
          message: "What song would you like to look up?",
          name: "Song"
        },
        {
          type: "input",
          message: "Who is the artist?",
          name: "Artist"
        }
      ])
        .then((response) => {
          if (response.Song === "" && response.Artist === "") {
            spotify.search({ type: 'track', query: 'artist:Ace%20of%20Base%20track:The%20Sign', limit: 1 }, (error, data) => {
              getSongInfo(error, data);
            });
          }
          else {
            spotify.search({ type: 'track', query: `artist:${response.Artist}%20track:${response.Song}`, limit: 1 }, (error, data) => {
              getSongInfo(error, data);
            });
          }
        });
    }
  }
  else if (p1 === "movie-this") {
    if (p2) {
      request(`http://www.omdbapi.com/?t=${p2}&y=&plot=short&apikey=6da7fe52`, (error, response, body) => {
        getMovieData(error, response, body);
      });
    }
    else {
      inquirer.prompt([
        {
          type: "input",
          message: "What movie would you like to look up?",
          name: "Movie"
        }
      ])
        .then((response) => {
          if (response.Movie === "") {
            request(`http://www.omdbapi.com/?t=Mr+Nobody&y=&plot=short&apikey=6da7fe52`, (error, response, body) => {
              getMovieData(error, response, body);
            });
          }
          else {
            request(`http://www.omdbapi.com/?t=${response.Movie}&y=&plot=short&apikey=6da7fe52`, (error, response, body) => {
              getMovieData(error, response, body);
            });
          }
        });
    };
  }
  else if (p1 === "do-what-it-says") {
    fs.readFile("random.txt", "utf8", (error, data) => {
      if (error) console.log(error);
      else {
        data = data.split(", ");
        var firstNum = Math.floor(Math.random() * ((data.length - 1) / 2)) * 2;
        var secondNum = firstNum + 1;
        newLiri(data[firstNum], data[secondNum]);
      };
    });
  };
}

function getTweets(p1, p2) {
  client.get('statuses/user_timeline', { screen_name: p1 }, (error, tweets, response) => {
    if (error) console.log(tweets.error);
    else if (response.statusCode === 200 && tweets.length > 0) {
      console.log(`${p2} last twenty tweets: `);
      fs.appendFile("log.txt", `${p2} last twenty tweets: `, (err) => { if (err) return console.log(err) });
      for (let i = 0; i < tweets.length; i++) {
        const element = tweets[i];
        console.log(`${element.created_at}: ${element.text}`);
        fs.appendFile("log.txt", `\n${element.created_at}: ${element.text}, `, (err) => { if (err) return console.log(err) });
      };
      fs.appendFile("log.txt", `\n-------------------------\n`, (err) => { if (err) return console.log(err) });
    }
    else {
      console.log("There are no tweets for that user name.");
    };
  });
}

function getSongInfo(error, data) {
  if (error) console.log(error);
  else if (data.tracks.total === 0) return console.log("We have no track that fits your search parameters.");
  else {
    const searchData = data.tracks;
    for (let i = 0; i < searchData.items.length; i++) {
      const element = searchData.items[i];
      console.log(
        `Artist(s): ${element.artists[0].name}`,
        `\nSong name: ${element.name}`,
        `\nAlbum name: ${element.album.name}`,
        `\nSpotify preview: ${element.preview_url}`
      );
      appendSongToLog(element);
    };
  };
}

function getMovieData(error, response, body) {
  if (error) console.log(error);
  var movie = JSON.parse(body);
  if (movie.Response === 'False') return console.log(movie.Error);
  else if (!error && response.statusCode === 200) {
    console.log(
      `Title: ${movie.Title}`,
      `\nRelease Date: ${movie.Year}`,
      `\nIMDB Rating: ${movie.imdbRating}`,
      `\nRotten Tomatoes Rating: ${movie.Ratings[1].Value}`,
      `\nCountry of Origin: ${movie.Country}`,
      `\nLanguage: ${movie.Language}`,
      `\nPlot Synopsis: ${movie.Plot}`,
      `\nStarring: ${movie.Actors}`
    );
  };
  appendMovieToLog(movie);
}

function appendMovieToLog(p1) {
  fs.appendFile("log.txt", [
    `Title: ${p1.Title}`,
    `\nRelease Date: ${p1.Year}`,
    `\nIMDB Rating: ${p1.imdbRating}`,
    `\nRotten Tomatoes Rating: ${p1.Ratings[1].Value}`,
    `\nCountry of Origin: ${p1.Country}`,
    `\nLanguage: ${p1.Language}`,
    `\nPlot Synopsis: ${p1.Plot}`,
    `\nStarring: ${p1.Actors}`,
    `\n-------------------------\n`
  ], (err) => { if (err) return console.log(err) });
}

function appendSongToLog(p1) {
  fs.appendFile("log.txt", [
    `Artist(s): ${p1.artists[0].name}`,
    `\nSong name: ${p1.name}`,
    `\nAlbum name: ${p1.album.name}`,
    `\nSpotify preview: ${p1.preview_url}`,
    `\n-------------------------\n`
  ], (err) => { if (err) return console.log(err) });
}