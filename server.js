'use strict'

let pageNum = 1;
let giganticArray = [];
const express = require('express')
const superagent = require('superagent');
const dotenv = require('dotenv');
const cors = require('cors');
const pg = require('pg');
const { render } = require('ejs');
const methodOverride = require('method-override');
let fs = require('fs');
fs.writeFile('garbage.txt', '', (err => console.log('FILE ERROR', err)));

dotenv.config();

const app = express();
console.log(process.env.PORT);
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
const RAWG_API_KEY = process.env.RAWG_API_KEY;


app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

app.get('/', homePage);
app.post('/search', getSearchCriteria);
app.post('/addGame', addGame);
app.post('/details', viewDetails);

client.connect()
  .then(() => {
    console.log('Spun up the Databass');
    app.listen(PORT, () => {
      console.log(`Server is working on ${PORT}`);
    })
  })
  .catch(err => {
    console.log('Unable to connect, guess we are antisocial:', err);
  });

//FUNCTIONS
function viewDetails(req, res) {
  console.log('FIRED! viewDetails', req.body);
  //////

  let secondURL = `https://api.rawg.io/api/games/${req.body.game_id}?key=230e069959414c6f961df991eb43017f`;
  console.log('Details URL', secondURL);

  superagent(secondURL)
    .then(data => {
      //console.log('resultToObj', resultToObj(data, 'detail'))
      res.render('details', resultToObj(data, 'detail'));
    })
    .catch(err => console.log('View Details Could Not Be Completed.  Check your number and try again:', err));

}

function addGame(req, res) {
  console.log('FIRED! addGame', req.body.game_id);

  let SQL = 'INSERT INTO gameinventorydata (title, category, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
  // let values = [//enter values here to access data from API example: req.body.title];
  let secondURL = `https://api.rawg.io/api/games/${req.body.game_id}?key=230e069959414c6f961df991eb43017f`;
  console.log('Add Game URL', secondURL);
  superagent(secondURL)
    .then(data => {
      return resultToObj(data, 'db');
    })
    .then(obj => {
      let { name, genre, description, game_id, image_url, platform, platform_id, publisher, release_date, developer } = obj.detailData;

      let values = [name, genre, 'userProvide', description, -1, game_id, image_url, 'userNotes', platform_id, platform, publisher, release_date, 'noSiteProvided'];
      return values;
    })
    .then(values => {
      client.query(SQL, values)
        .then(data => console.log('Shoved in the Databass!'))
        .catch(err => console.log('Whoops, didn\'t make it in the databass', err));
    });
}

function homePage(req, res) {
  res.render('index');
}

function getSearchCriteria(req, res) {

  let { searchArea, searchCriteria } = req.body;

  setURL(searchArea, searchCriteria);
  console.log('searchURL', URL);
  superagent(URL)
    .then(data => {
      return resultToObj(data, 'search');
    })
    .then(obj => res.render('searchResults.ejs', obj))
    .catch(err => console.log('Unable to access RAWG games database. Or reached end of pages, you decide.'));
}

//All games for platform search: (platforms, id <= API console unique id.  Can pull from database)
//Specific Game Title: (games, <name of game>)
//Search for games release on a specific date.
function setURL(searchArea, searchCriteria, searchDate = '0000-00-00') {
  let urlSearchCritera = searchCriteria.replace(/\s/g, '%20');
  console.log(`searchCriteria: ${searchCriteria}  Modded: ${urlSearchCritera}`);
  let appendCriteria = '';
  if (searchArea === 'date') { appendCriteria = `&dates=${searchDate}` }

  URL = `https://api.rawg.io/api/${searchArea}?key=${RAWG_API_KEY}&search=${urlSearchCritera}&page_size=40${appendCriteria}`;
  console.log('URL to Get:', URL);
}

// data is from superagent result, search is either 'detail' or 'type' or 'db'

function resultToObj(superAgentData, type = 'search') {
  let data = superAgentData.body;
  let array = [];
  let appendString = '';
  let sliceAmount = 0;
  if (type === 'search') {
    data = superAgentData.body.results
    data.map((element) => {
      array.push({ name: element.name, id: element.id })
    });
    console.log('Array', array);
    return ({ searchResultsData: array });
  };

  if (type === 'detail' || 'db') {
    if (type === 'detail') {
      appendString = ', ';
      sliceAmount = -2;
    } else {
      appendString = '@';
      sliceAmount = -1;
    }

    let platformString = '';
    let platformId = '';
    let genreString = '';
    let developersString = '';
    let publisherString = '';

    data.platforms.map(element => {

      platformString += `${element.platform.name}${appendString}`;
      platformId += `${element.platform.id} ${appendString} `;
    })
    platformString = platformString.slice(0, sliceAmount);


    data.genres.map(element => {

      genreString += `${element.name}${appendString}`;


    });
    genreString = genreString.slice(0, sliceAmount);

    data.developers.map(element => {
      developersString += `${element.name}${appendString}`;
    })
    developersString = developersString.slice(0, sliceAmount);
    data.publishers.map(element => {
      publisherString += `${element.name}${appendString}`;
    })
    publisherString = publisherString.slice(0, sliceAmount);

    let { name, description_raw, id, background_image, released, } = data;
    let detailObj = {
      name: name,
      genre: genreString,
      description: description_raw,
      game_id: id,
      image_url: background_image,
      platform: platformString,
      platform_id: platformId,
      publisher: publisherString,
      release_date: released,
      developer: developersString
    };

    return { detailData: detailObj };

  }
}
