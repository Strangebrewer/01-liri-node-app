require("dotenv").config();

var keys = require("./keys.js");
var request = require("request");
var fs = require("fs");

var Spotify = require('node-spotify-api');
var Twitter = require('twitter');

var spotify = new Spotify(keys.spotify);
var client = new Twitter(keys.twitter);

var firstArg = process.argv[2];
var secondArg = process.argv[3];

function getSongInfo(error, data, cmdOne, cmdTwo) {
  if (error) console.log(error);
  else {
    const searchData = data.tracks;
    for (let i = 0; i < searchData.items.length; i++) {
      const element = searchData.items[i];
      console.log("Artist(s):", element.artists[0].name);
      console.log("Song name:", element.name);
      console.log("Album name:", element.album.name);
      console.log("Spotify preview:", element.preview_url);
      console.log("");
      appendSongToLog(element, cmdOne, cmdTwo);
    }
  }
}

function getMovieData(error, response, body, cmdOne, cmdTwo) {
  if (error) console.log(error);
  else if (!error && response.statusCode === 200) {
    var movie = JSON.parse(body);
    console.log("Title:", movie.Title);
    console.log("Release Date:", movie.Year);
    console.log("IMDB Rating:", movie.imdbRating);
    console.log("Rotten Tomatoes Rating:", movie.Ratings[1].Value);
    console.log("Country of Origin:", movie.Country);
    console.log("Language:", movie.Language);
    console.log("Plot Synopsis:", movie.Plot);
    console.log("Starring:", movie.Actors);
    appendMovieToLog(movie, cmdOne, cmdTwo);
  }
}

function appendMovieToLog(p1, p2, p3) {
  fs.appendFile("log.txt", `First Argument: ${p2}`, (err) => { if (err) return console.log(err) }); 
  fs.appendFile("log.txt", `, Second Argument: ${p3}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Title: ${p1.Title}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Release Date: ${p1.Year}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, IMDB Rating: ${p1.imdbRating}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Rotten Tomatoes Rating: ${p1.Ratings[1].Value}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Country of Origin: ${p1.Country}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Language: ${p1.Language}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Plot Synopsis: ${p1.Plot}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Starring: ${p1.Actors}, `, (err) => { if (err) return console.log(err) });
}

function appendSongToLog(p1, p2, p3) {
  fs.appendFile("log.txt", `First Argument: ${p2}`, (err) => { if (err) return console.log(err) }); 
  fs.appendFile("log.txt", `, Second Argument: ${p3}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Artist(s): ${p1.artists[0].name}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Song name: ${p1.name}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Album name: ${p1.album.name}`, (err) => { if (err) return console.log(err) });
  fs.appendFile("log.txt", `, Spotify preview: ${p1.preview_url}, `, (err) => { if (err) return console.log(err) });
}

function runLiri(p1, p2) {
  switch (p1) {
    case `new-tweet`:
      client.post('statuses/update', { status: p2 }, (error, tweet, response) => {
        if (error) console.log(error);
        console.log(tweet.text);
      });
      break;

    case `my-tweets`:
      client.get('statuses/user_timeline', { screen_name: 'NarfBrains', count: 20 }, (error, tweets, response) => {
        if (error) console.log(error);
        fs.appendFile("log.txt", `My Last Twenty Tweets: `, (err) => { if (err) return console.log(err) }); 
        for (let i = 0; i < tweets.length; i++) {
          const element = tweets[i];
          console.log(element.created_at, ": ", element.text);
          fs.appendFile("log.txt", `${element.created_at}: ${element.text}, `, (err) => { if (err) return console.log(err) }); 
        }
      });
      break;

    case `spotify-this-song`:
      if (p2 === undefined) {
        spotify.search({ type: 'track', query: 'The Sign', limit: 1 }, (error, data) => {
          getSongInfo(error, data, p1, p2);
        });
      }
      else {
        spotify.search({ type: 'track', query: p2, limit: 1 }, (error, data) => {
          getSongInfo(error, data, p1, p2);
        });
      }
      break;

    case `movie-this`:
      if (p2 === undefined) {
        request("http://www.omdbapi.com/?t=Mr+Nobody&y=&plot=short&apikey=6da7fe52", (error, response, body) => {
          getMovieData(error, response, body, p1, p2);
        });
      }
      else {
        request("http://www.omdbapi.com/?t=" + p2 + "&y=&plot=short&apikey=6da7fe52", (error, response, body) => {
          getMovieData(error, response, body, p1, p2);
        });
      }
      break;

    case `do-what-it-says`:
      fs.readFile("random.txt", "utf8", (error, data) => {
        if (error) console.log(error);
        else {
          data = data.split(", ");
          var firstNum = Math.floor(Math.random() * ((data.length - 1) / 2)) * 2;
          var secondNum = firstNum + 1;
          runLiri(data[firstNum], data[secondNum]);
          console.log(firstNum);
          console.log(secondNum);
          console.log(data[firstNum]);
          console.log(data[secondNum]);
        }
      })
      break;

    default:
      console.log("You must enter valid criteria");
  }
}

runLiri(firstArg, secondArg);