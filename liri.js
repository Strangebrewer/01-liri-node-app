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
    choices: ["new tweet", "get tweets", "spotify this song", "movie this", "do what it says"],
    name: "Action"
  }
]).then((response) => {
  newLiri(response.Action);
});

function newLiri(p1, p2) {
  if (p1 === "new tweet") {
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
  else if (p1 === "get tweets") {
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
          getTweets('NarfBrains', "My");
        }
      });
  }
  else if (p1 === "spotify this song") {
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
  else if (p1 === "movie this") {
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
          console.log(response);
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
    }
  }
  else if (p1 === "do what it says") {
    fs.readFile("random.txt", "utf8", (error, data) => {
      if (error) console.log(error);
      else {
        data = data.split(", ");
        var firstNum = Math.floor(Math.random() * ((data.length - 1) / 2)) * 2;
        var secondNum = firstNum + 1;
        newLiri(parseMyString(data[firstNum]), data[secondNum]);
        console.log(parseMyString(data[firstNum]));
        console.log(data[secondNum]);
      }
    })
  }
}

function parseMyString(obj) {
  return Function("'use strict';return (" + obj + ")")();
}

function getTweets(p1, p2) {
  client.get('statuses/user_timeline', { screen_name: p1, count: 20 }, (error, tweets, response) => {
    if (error) console.log(error);
    else {
      console.log(`${p2} last twenty tweets: `);
      fs.appendFile("log.txt", `${p2} last twenty tweets: `, (err) => { if (err) return console.log(err) });
      for (let i = 0; i < tweets.length; i++) {
        const element = tweets[i];
        console.log(element.created_at, ": ", element.text);
        fs.appendFile("log.txt", `${element.created_at}: ${element.text}, `, (err) => { if (err) return console.log(err) });
      }
    }
  });
}

function getSongInfo(error, data) {
  if (error) console.log(error);
  else if (data.tracks.total === 0) console.log("We have no track that fits your search parameters.");
  else {
    const searchData = data.tracks;
    for (let i = 0; i < searchData.items.length; i++) {
      const element = searchData.items[i];
      console.log(`Artist(s): ${element.artists[0].name}`);
      console.log(`Song name: ${element.name}`);
      console.log(`Album name: ${element.album.name}`);
      console.log(`Spotify preview: ${element.preview_url}`);
      console.log("");
      appendSongToLog(element);
    }
  }
}

function getMovieData(error, response, body) {
  if (error) console.log(error);
  else if (!error && response.statusCode === 200) {
    var movie = JSON.parse(body);
    console.log(`Title: ${movie.Title}`);
    console.log(`Release Date: ${movie.Year}`);
    console.log(`IMDB Rating: ${movie.imdbRating}`);
    console.log(`Rotten Tomatoes Rating: ${movie.Ratings[1].Value}`);
    console.log(`Country of Origin: ${movie.Country}`);
    console.log(`Language: ${movie.Language}`);
    console.log(`Plot Synopsis: ${movie.Plot}`);
    console.log(`Starring: ${movie.Actors}`);
    appendMovieToLog(movie);
  }
}

function appendMovieToLog(p1) {
  fs.appendFile("log.txt", `Title: ${p1.Title}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Release Date: ${p1.Year}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `IMDB Rating: ${p1.imdbRating}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Rotten Tomatoes Rating: ${p1.Ratings[1].Value}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Country of Origin: ${p1.Country}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Language: ${p1.Language}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Plot Synopsis: ${p1.Plot}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Starring: ${p1.Actors}, `, (err) => { if (err) return console.log(err) });
}

function appendSongToLog(p1) {
  fs.appendFile("log.txt", `Artist(s): ${p1.artists[0].name}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Song name: ${p1.name}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Album name: ${p1.album.name}, `, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `Spotify preview: ${p1.preview_url}, `, (err) => { if (err) return console.log(err) });
}

// function runLiri(p1, p2) {
//   switch (p1) {
//     case `new-tweet`:
//       client.post('statuses/update', { status: p2 }, (error, tweet, response) => {
//         if (error) console.log(error);
//         console.log(tweet.text);
//       });
//       break;

//     case `my-tweets`:
//       client.get('statuses/user_timeline', { screen_name: 'NarfBrains', count: 20 }, (error, tweets, response) => {
//         if (error) console.log(error);
//         fs.appendFile("log.txt", `My Last Twenty Tweets: `, (err) => { if (err) return console.log(err) });
//         for (let i = 0; i < tweets.length; i++) {
//           const element = tweets[i];
//           console.log(element.created_at, ": ", element.text);
//           fs.appendFile("log.txt", `${element.created_at}: ${element.text}, `, (err) => { if (err) return console.log(err) });
//         }
//       });
//       break;

//     case `spotify-this-song`:
//       if (p2 === undefined) {
//         spotify.search({ type: 'track', query: 'The Sign', limit: 1 }, (error, data) => {
//           getSongInfo(error, data, p1, p2);
//         });
//       }
//       else {
//         spotify.search({ type: 'track', query: p2, limit: 1 }, (error, data) => {
//           getSongInfo(error, data, p1, p2);
//         });
//       }
//       break;

//     case `movie-this`:
//       if (p2 === undefined) {
//         request("http://www.omdbapi.com/?t=Mr+Nobody&y=&plot=short&apikey=6da7fe52", (error, response, body) => {
//           getMovieData(error, response, body, p1, p2);
//         });
//       }
//       else {
//         request("http://www.omdbapi.com/?t=" + p2 + "&y=&plot=short&apikey=6da7fe52", (error, response, body) => {
//           getMovieData(error, response, body, p1, p2);
//         });
//       }
//       break;

//     case `do-what-it-says`:
//       fs.readFile("random.txt", "utf8", (error, data) => {
//         if (error) console.log(error);
//         else {
//           data = data.split(", ");
//           var firstNum = Math.floor(Math.random() * ((data.length - 1) / 2)) * 2;
//           var secondNum = firstNum + 1;
//           runLiri(data[firstNum], data[secondNum]);
//           console.log(firstNum);
//           console.log(secondNum);
//           console.log(data[firstNum]);
//           console.log(data[secondNum]);
//         }
//       })
//       break;

//     default:
//       console.log("You must enter valid criteria");
//   }
// }