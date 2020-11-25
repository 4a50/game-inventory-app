'use strict'

// let pageNum = 1;
let prevSearch = {};
let hasVisited = false;
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
app.get('/search', getSearchCriteria);
app.post('/addGame', addGame);
app.post('/details', viewDetails);

app.delete('/delete/:id', deleteGame);
app.get('/inventory', getInventory);

app.get('/update/:id', updateGame);
app.post('/dbDetails', dbDetail);

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

function dbDetail(req, res) {
  console.log('FIRED! Schwap!', req.body.game_id);
  let SQL = 'SELECT * FROM gameinventorydata WHERE game_id=$1';
  let values = [req.body.game_id];
  client.query(SQL, values)
    .then(data => {
      //console.log('FORMATDATABASEDATA', formatDbaseData(data.rows, 'detailData'));
      let obj = formatDbaseData(data.rows, 'detailData');
      let detailsPageCustom = { 'detailData': obj.detailData[0] };
      console.log('custom', detailsPageCustom);
      res.render('details', detailsPageCustom);
    })
    .catch((() => console.log('whoops!')));



}
function getInventory(req, res) {

  let SQL = "SELECT * FROM gameinventorydata";
  client.query(SQL)
    .then(data => {
      let sortedData = data.rows.sort(function (a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      })
      console.log(sortedData);
      return sortedData;
    })
    .then(data => {
      res.render('viewInventory', formatDbaseData(data, 'databaseDetails'));
    });
}
function formatDbaseData(rowArray, objName) {

  rowArray.map(element => {
    element.platform_id = element.platform_id.replace('@', ' ');
    element.platform_name = element.platform_name.replace('@', ' ');
    element.publisher = element.publisher.replace('@', ' ');
  });

  return { [objName]: rowArray };
}




function viewDetails(req, res) {
  console.log('FIRED! viewDetails', req.body);

  let secondURL = `https://api.rawg.io/api/games/${req.body.game_id}?key=230e069959414c6f961df991eb43017f`;
  console.log('Details URL', secondURL);

  superagent(secondURL)
    .then(data => {
      //console.log('resultToObj', resultToObj(data, 'detail'))
      res.render('details', resultToObj(data, 'detail'));
    })
    .catch(err => console.log('View Details Could Not Be Completed.  Check your number and try again:', err));

}

function updateGame(req, res) {
  console.log('this is the update game', req.params)
  let { name, genre, description, game_id, image_url, platform, platform_id, publisher, release_date, developer } = req.params;
  let SQL = `UPDATE gameinventorydata (name, category, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`;
  let values = [name, genre, description, game_id, image_url, platform, platform_id, publisher, release_date, developer];
  client.query(SQL, values)
    .then(data => {
      res.redirect('details', resultToObj(data, 'detail'));
    })
    .catch(err => console.error('Update game could not be completed', err))
}

// eslint-disable-next-line no-unused-vars
function addGame(req, res) {
  console.log('FIRED! addGame', req.body.game_id, req.body.parent_page);

  let SQL = 'INSERT INTO gameinventorydata (name, category, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
  // let values = [//enter values here to access data from API example: req.body.title];
  let secondURL = `https://api.rawg.io/api/games/${req.body.game_id}?key=230e069959414c6f961df991eb43017f`;
  console.log('Add Game URL', secondURL);
  superagent(secondURL)
    .then(data => {
      return resultToObj(data, 'db');
    })
    .then(obj => {
      // eslint-disable-next-line no-unused-vars
      let { name, genre, description, game_id, image_url, platform, platform_id, publisher, release_date, developer } = obj.detailData;

      let values = [name, genre, 'userProvide', description, -1, game_id, image_url, 'userNotes', platform_id, platform, publisher, release_date, 'noSiteProvided'];
      return values;
    })
    .then(values => {
      client.query(SQL, values)
        .then(() => console.log('Shoved in the Databass!'))
        .catch(err => console.log('Whoops, didn\'t make it in the databass', err));
    })
    .then(() => {
      hasVisited = true;
      res.redirect('/search');
    });
}

function homePage(req, res) {
  res.render('index');
}

function getSearchCriteria(req, res) {
  console.log('original URL', req.body);
  let sURL = '';
  if (hasVisited) {
    console.log('presearch', prevSearch);
    sURL = setURL(prevSearch.searchArea, prevSearch.searchCriteria);
    hasVisited = false;
  } else {
    let { searchArea, searchCriteria } = req.body;
    prevSearch = { searchArea: req.body.searchArea, searchCriteria: req.body.searchCriteria };
    console.log('prevsearchInit', prevSearch);
    console.log('searchArea', searchArea, searchCriteria);
    sURL = setURL(searchArea, searchCriteria);
  }


  console.log('searchURL', sURL);
  superagent(sURL)
    .then(data => {
      return resultToObj(data, 'search');
    })
    .then(obj => res.render('searchResults.ejs', obj))
    .catch(err => console.error('Unable to access RAWG games database. Or reached end of pages, you decide.', err));
}

//All games for platform search: (platforms, id <= API console unique id.  Can pull from database)
//Specific Game Title: (games, <name of game>)
//Search for games release on a specific date.
function setURL(searchArea, searchCriteria, searchDate = '0000-00-00') {
  let urlSearchCritera = searchCriteria.replace(/\s/g, '%20');
  console.log(`searchCriteria: ${searchCriteria}  Modded: ${urlSearchCritera}`);
  let appendCriteria = '';
  if (searchArea === 'date') { appendCriteria = `&dates=${searchDate}` }

  let URL = `https://api.rawg.io/api/${searchArea}?key=${RAWG_API_KEY}&search=${urlSearchCritera}&page_size=40${appendCriteria}`;
  console.log('URL to Get:', URL);
  return URL;

}

function deleteGame(req, res) {

  console.log('FIRED! BAM! deleteGame', req.params.id);

  let SQL = `DELETE FROM gameinventorydata WHERE game_id=${req.params.id};`;
  client.query(SQL)
    .then(data => console.log('data deleted', data))
    .then(res.redirect('/inventory'))
    .catch(err => console.log('Delete did not go according to plan...', err));
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
  }

  // eslint-disable-next-line no-constant-condition
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
      platformId += `${element.platform.id}${appendString}`;
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
