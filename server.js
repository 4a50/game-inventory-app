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
}


function addGame(req, res) {
  console.log('FIRED! addGame', req.body.game_id);


  let SQL = 'INSERT INTO gameInventoryData (title, category, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
  // let values = [//enter values here to access data from API example: req.body.title];
  let secondURL = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${req.body.game_id}`;
  console.log(secondURL);
  superagent(secondURL)
    .then(data => {
      let platformString = '';
      result.platforms.map(element => {
        platformString += `${element.name}@`;
      });

      let result = data.body.results[0];
      values = [result.name, result.genre[0].name], 'unk', 'Itsa a game', -1, result.id, result.background_image, 'Insert Notes Here!', platformString, 

    });
  // client.query (SQL, values)
  //   .then(do something)
}

function homePage(req, res) {
  res.render('index');
}


// let URL = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&platforms=105&page_size=40&ordering=name`;
// function searchCriteria(req, res) {

//   homePage(req, res);
// }


function getSearchCriteria(req, res) {
  //  const platformId = '105';


  //What ever the user set from the front end.  For now we will hard code.
  //Specific Game Title: (games, <name of game>)

  let { searchArea, searchCriteria } = req.body;

  // let searchArea = 'games';
  // let searchCriteria = 'castlevania';

  setURL(searchArea, searchCriteria);
  superagent(URL)
    .then(data => {
      let webPageValuesArray = [];
      data.body.results.map((element) => {
        webPageValuesArray.push({ name: element.name, id: element.slug });
      });
      console.log('webPageValues', webPageValuesArray);
      return webPageValuesArray;
    })
    .then(element => {
      //res.send(element);
      res.render('searchResults.ejs', { searchResultsData: element });
    })


    // console.log('data and stuff', data.body.results[0].name);
    // if (data.body.next !== null) {
    //   URL = data.body.next;
    //   pageNum++;
    //   _homePage(req, res);
    // }
    // else {
    //   res.send(`DONE BRO! ${data.body.results}`);
    //   URL = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&platforms=105&page_size=40&ordering=name`;
    //   pageNum = 1;
    // }

    .catch(err => {
      console.log('Unable to access RAWG games database. Or reached end of pages, you decide.');

    });
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

