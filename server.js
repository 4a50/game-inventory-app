'use strict'

// Global Variables /////////////////////////////////////////////////

let prevSearch;
let hasVisited = false;
let dbDeleteConfirmationKey;
let canUpdateInfo = false;


// Dependencies ////////////////////////////////////////////////////

const express = require('express')
const superagent = require('superagent');
const dotenv = require('dotenv');
const cors = require('cors');
const pg = require('pg');
const { render } = require('ejs');
const methodOverride = require('method-override');

const { query } = require('express');

// Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
const RAWG_API_KEY = process.env.RAWG_API_KEY;


// Initial Setup of Express and Method-Override
app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

// Routes ///////////////////////////////////////////////////////////

app.get('/', homePage);
app.post('/search', getSearchCriteria);
app.get('/search', getSearchCriteria);
app.post('/addGame', addGame);
app.get('/details/:game_id', viewDetails);

app.post('/update', updateGameButton);
app.put('/update/:id', updateGameDetails);
app.delete('/delete/:id', deleteGame);
app.get('/inventory', getInventory);

app.delete('/hardDeleteDB', eraseDBConfirmed);

app.get('/wipeDB', clearDatabase);
app.get('/inventory/verify', inventoryVerify);
app.post('/inventory/verify/results', inventoryVerifyResults);

app.get('/aboutUs', aboutUs);

app.get('/inventory/verify/reset', resetInventoryVerification);

app.get('/longplay/:game_name', getLongplayVideo);


app.get('/getConsoleIds', getConsoleIds);

app.get('/test', randomGameSuggestion);



// Server and Database Link ////////////////////////////////////////

client.connect()
  .then(() => {
    console.log('Spun up the Databass');
    app.listen(PORT, () => {
      console.log(`Server is working on ${PORT}`);
    })
  })
  .catch(err => {
    console.error('Unable to connect.  Check if pg has been started', err);
  });

///////////////////////////////FUNCTIONS - Page Drivers

function aboutUs(req, res) {
  res.render('aboutUs');
}



function getInventory(req, res) {

  let SQL = 'SELECT * FROM gameinventorydata';
  client.query(SQL)
    .then(data => {
      let sortedData = data.rows.sort(function (a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      })
      return sortedData;
    })
    .then(data => {
      res.render('viewInventory', formatDbaseData(data, 'databaseDetails'));
    });
}

function clearDatabase(req, res) {

  let randomNum1 = Math.floor(Math.random() * 100);
  let randomNum2 = Math.floor(Math.random() * 100);
  let randomProduct = randomNum1 + randomNum2;

  dbDeleteConfirmationKey = randomProduct;

  res.render('dbWipeConfirm', { 'numTest': `${randomNum1} + ${randomNum2} = ` });
}

function eraseDBConfirmed(req, res) {

  let userAnswer = parseInt(req.body.testAnswer);

  if (userAnswer === dbDeleteConfirmationKey) {
    let SQL = 'DELETE FROM gameInventoryData;';
    client.query(SQL)
      .then(console.log('The DB has been wiped sparkling clean. Hope you meant to do that!'))
      .then(res.redirect('/inventory'))
      .catch(err => console.error('ERROR in wiping the database:', err));

  } else {
    console.log('Sending you back before you accidentally hurt yourself or your inventory data.')
    res.redirect('/inventory');
  }
}

async function viewDetails(req, res) {
  let dataRows;
  let SQL = 'SELECT * FROM gameinventorydata WHERE game_id=$1';
  let isInDB = false;

  await client.query(SQL, [req.params.game_id])
    .then(data => {
      if (data.rows.length > 0) {
        console.log('Data Available in Database');
        dataRows = data.rows;
        isInDB = true;
      }
    });
  if (isInDB) {
    let dataObj = dataRows[0];
    dataObj.isInDB = isInDB;
    let formattedDetailData = { detailData: (formatDbaseData(dataRows, 'detailData')).detailData[0] };
    res.render('details', formattedDetailData);
  }
  else {
    console.log('Rendering From API');
    let secondURL = `https://api.rawg.io/api/games/${req.params.game_id}?key=230e069959414c6f961df991eb43017f`;

    await superagent(secondURL)
      .then(data => {
        let sendToPageObj = resultToObj(data, 'detail');
        sendToPageObj.detailData.isInDB = isInDB;
        res.render('details', sendToPageObj);
      })
      .catch(err => console.error('View Details Could Not Be Completed.  Check your number and try again:', err));
  }

}
function updateGameButton(req, res) {

  let SQL = `SELECT * FROM gameinventorydata WHERE game_id=${req.body.game_id};`;
  client.query(SQL)
    .then(data => {
      res.render('update.ejs', formatDbaseData(data.rows, 'databaseDetails'));
    })
    .catch(err => console.error('Update game could not be completed', err))
}
function updateGameDetails(req, res) {

  let game = req.body;

  let SQL = 'UPDATE gameInventoryData SET name=$1, genre=$2, condition=$3, description=$4, game_count=$5, game_id=$6, image_url=$7, notes=$8, platform_id=$9, platform_name=$10, publisher=$11, release_date=$12, video_url=$13, developer=$14 WHERE game_id=$15;';

  let values = [game.name, game.genre, game.condition, game.description, game.game_count, game.game_id, game.image_url, game.notes, game.platform_id, game.platform_name, game.publisher, game.release_date, game.video_url, game.developer, game.game_id];

  client.query(SQL, values)
    .then(() => {
      res.redirect(`/details/${game.game_id}`);
    })
    .catch(err => console.error(err));
}

async function addGame(req, res) {

  let duplicateCheck = false;

  let SQL = `SELECT * FROM gameInventoryData WHERE game_id=${req.body.game_id};`

  await client.query(SQL)
    .then(dbData => {
      if (dbData.rows.length > 0) {
        duplicateCheck = true;
      }
    })
    .catch(err => console.error('game does not exist in db or another error occurred', err));

  if (!duplicateCheck) {

    let SQL = 'INSERT INTO gameinventorydata (name, genre, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url, developer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);';

    let secondURL = `https://api.rawg.io/api/games/${req.body.game_id}?key=230e069959414c6f961df991eb43017f`;

    superagent(secondURL)
      .then(data => {
        return resultToObj(data, 'db');
      })
      .then(obj => {

        let { name, genre, description, game_id, image_url, platform_name, platform_id, publisher, release_date, developer, video_url } = obj.detailData;

        let values = [name, genre, 'userProvide', description, -1, game_id, image_url, 'userNotes', platform_id, platform_name, publisher, release_date, video_url, developer];
        return values;
      })
      .then(values => {
        client.query(SQL, values)
          .then(() => console.log('INSERTED into Database'))
          .catch(err => console.error('Error Inserting into Database', err));
      })
      .then(() => {
        hasVisited = true;
        res.redirect('/search');
      });

  } else {
    console.log('Game Exsists in Database');
    hasVisited = true;
    res.redirect('/search');
  }
}

async function homePage(req, res) {
  let gameData;
  gameData = await randomGameSuggestion();

  res.render('index', { gameData: gameData });
}

async function getSearchCriteria(req, res) {

  let createComp;

  if (hasVisited) {
    console.log('Loading Previous Search Results', prevSearch);
    console.log('Setting hasVisited to FALSE');
    hasVisited = false;
    let prevSearchFinal = prevSearch;
    createComp = await createCompare(prevSearch)
      .then(data => { return data });
    prevSearchFinal.resultsCompare = createComp;
    res.render('searchResults.ejs', prevSearch);
  } else {
    console.log('Loading API Search Results');
    let sURL = '';
    sURL = setURL(req.body.searchArea, req.body.searchCriteria);

    let renderPageObj = await superagent(sURL)
      .then(data => {
        let finalObj = resultToObj(data, 'search');
        prevSearch = finalObj;
        return finalObj;
      })
      .then(finalObject => {
        return finalObject;
      })
      .catch(err => console.error('Unable to access RAWG games database', err));

    let compareArray = await createCompare(prevSearch)
      .then(data => { return data })
      .catch(err => console.log('WEB ERROR', err));

    renderPageObj.resultsCompare = compareArray;
    res.render('searchResults.ejs', renderPageObj);
  }
}
function createCompare(objToUse) {
  let compareArray = resultsCompareDb(objToUse)
    .then(data => {
      return data;
    })
    .catch(err => console.error('compareArrayError', err));
  return compareArray;
}

function deleteGame(req, res) {

  let SQL = `DELETE FROM gameinventorydata WHERE game_id=${req.params.id};`;
  client.query(SQL)
    .then(data => console.log('data deleted', data))
    .then(res.redirect('/inventory'))
    .catch(err => console.error('Unable to DELETE game from inventory:', err));
}

async function inventoryVerify(req, res) {
  let disableSubmit = false;
  let SQL = 'SELECT game_id, name, image_url FROM gameInventoryData';
  await client.query(SQL)
    .then(data => {
      let sortedData = data.rows.sort(function (a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      })
      return sortedData;
    })
    .then(data => {
      res.render('inventory', { databaseItems: data });
    })
    .catch(err => { console.error('error in verification', err) });
}

function inventoryVerifyResults(req, res) {

  let isSingle = false;
  let arr = [];
  let SQL = '';
  resetInventoryVerification(); //this resets all inventory verification checkboxes
  if (typeof (req.body.game_id) === 'string') {
    isSingle = true;

  }
  (isSingle ? arr.push(req.body.game_id) : arr = req.body.game_id);
  arr.map(element => {
    SQL = `UPDATE gameInventoryData SET verified=$1 WHERE game_id=${element};`;

    client.query(SQL, [true])
      .then(data => console.log(data))
      .catch(err => console.log('ERROR UPDATING VERIFICATION: ', err));
  })
  SQL = `SELECT name, game_id, image_url FROM gameInventoryData WHERE NOT (verified='true');`;
  client.query(SQL)
    .then(data => {
      let sortedData = data.rows.sort(function (a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
      return sortedData;
    })
    .then(data => {
      return data;
    })
    .then(data => {
      res.render('invResults', { invResultsData: data });
    })
    .catch(err => console.error('Error Accessing Inventory Verification results', err));
}
// Helper Functions

// All games for platform search: (platforms, id <= API console unique id.  Can pull from database)
// Specific Game Title: (games, <name of game>)
// Search for games release on a specific date.
function setURL(searchArea, searchCriteria, searchDate = '0000-00-00') {
  let urlSearchCritera = searchCriteria.replace(/\s/g, '%20');

  let appendCriteria = '';
  if (searchArea === 'date') { appendCriteria = `&dates=${searchDate}` }

  let URL = `https://api.rawg.io/api/${searchArea}?key=${RAWG_API_KEY}&search=${urlSearchCritera}&page_size=40${appendCriteria}`;

  return URL;

}
// data is from superagent result, type is either 'detail' or 'search' or 'db'

function resultToObj(superAgentData, type = 'search') {

  let data = superAgentData.body;
  let array = [];
  let appendString = '';
  let sliceAmount = 0;
  if (type === 'search') {
    data = superAgentData.body.results
    data.map((element) => {
      array.push({ name: element.name, game_id: element.id, image_url: element.background_image })
    });
    return ({ searchResultsData: array });
  }


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

    let video_url = `https://www.youtube.com/results?search_query=${name.replace(/\s/g, '+')}+longplay`;


    description_raw = textScrubber(description_raw);

    let detailObj = {
      name: name,
      genre: genreString,
      description: description_raw,
      game_id: id,
      image_url: background_image,
      platform_name: platformString,
      platform_id: platformId,
      publisher: publisherString,
      release_date: released,
      developer: developersString,
      video_url: video_url
    };

    return { detailData: detailObj };

  }
}

function formatDbaseData(rowArray, objName) {

  rowArray.map(element => {


    if (element.platform_id) { element.platform_id = element.platform_id.replace(/@/g, ' '); }
    if (element.platform_name) { element.platform_name = element.platform_name.replace(/@/g, ' '); }
    if (element.publisher) { element.publisher = element.publisher.replace(/@/g, ' '); }
    if (element.developer) { element.developer = element.developer.replace(/@/g, ' '); }
    if (element.genre) { element.genre = element.genre.replace(/@/g, ' '); }

  });

  return { [objName]: rowArray };
}
function textScrubber(str) {

  let regex = /([<](.*?)[>])/g; //selects all tags
  let regex2 = /((https:\/\/)(.*?)[/])(\s)|((http:\/\/)(.*?)[/])(\s)/g; //web addresses
  let brRegex = /(<br\/>)/g;
  let finalString = str.replace(brRegex, '\n'); //changing <br/> to newlines

  finalString = finalString.replace(regex, ''); //Removes all HTML tags
  finalString = finalString.replace(regex2, ''); //Removes web addresses
  return finalString;
}
async function resetInventoryVerification(req, res) {
  let SQL = `UPDATE gameInventoryData SET verified='false';`;
  await client.query(SQL)
    .then((data) => {
      console.log(`SET ALL "VERIFIED" values to false`);


    })
    .catch(err => console.error('Unable to set all VERIFIED to false', err));
}
async function getLongplayVideo(req, res) {

  let gameToGet = req.params.game_name.replace(/\s/g, '+');
  console.log(gameToGet);

  res.redirect(`https://www.youtube.com/results?search_query=${gameToGet}+longplay`);
}

async function getConsoleIds(req, res) {
  let SQL = 'INSERT INTO platforms (platform_id, platform_name) VALUES ($1, $2)';
  let URL = 'https://api.rawg.io/api/platforms/lists/parents?key=230e069959414c6f961df991eb43017f';
  let consoleDataArray = [];

  await superagent(URL)
    .then(data => {
      return data.body.results;
    })
    .then(data => {
      data.map(parents => {
        parents.platforms.map(platform => {
          consoleDataArray.push({ platform_id: platform.id, platform_name: platform.name });
        })
      })
      return consoleDataArray;
    })
    .then((data) => {
      client.query('DROP TABLE IF EXISTS platforms; CREATE TABLE platforms (id SERIAL PRIMARY KEY, platform_id INT, platform_name VARCHAR(255));');
      return data;
    })
    .then(data => {
      data.map(element => {
        client.query(SQL, [element.platform_id, element.platform_name]);
      })
    })
    .then(() => { res.redirect('/') })
    .catch(err => console.error('Unable to retrieve consoles:', err));
}

async function randomGameSuggestion(req, res) {
  let SQL = `SELECT game_Id, name, image_url FROM gameinventorydata ORDER BY RANDOM() LIMIT 1;`;
  let returnObj;
  await client.query(SQL)
    .then(data => {

      if (!data.rows[0]) {
        console.log('No Data in the database')
        returnObj = { game_id: 0, name: 'Oh No! Nothing in your inventory', image_url: '404' };
      }
      else {
        returnObj = data.rows[0];
      }
    })
    .catch(err => console.error('Unable to access database for random entry:', err));

  return returnObj;
}

async function resultsCompareDb(resultsArr) {

  let game_idArray = [];
  let numOfValuesSQL = '';
  let returnIdArray;
  resultsArr.searchResultsData.map(elem => { game_idArray.push(elem.game_id); });


  //generate sql number of values to test
  game_idArray.map((elem, idx) => {
    if (idx + 1 === game_idArray.length) {
      numOfValuesSQL += `game_id=$${idx + 1}`;
    } else {
      numOfValuesSQL += `game_id=$${idx + 1} OR `;
    }
  });

  let SQL = `SELECT game_id FROM gameInventoryData WHERE ${numOfValuesSQL};`

  await client.query(SQL, game_idArray)
    .then(data => {

      returnIdArray = data.rows
    })
    .catch(err => console.error('ERROR retrieving DB game_ids for compare', err));
  let returnArrayOnly = []
  returnIdArray.map(elem => {
    returnArrayOnly.push(elem.game_id);
  });

  return returnArrayOnly;
}

