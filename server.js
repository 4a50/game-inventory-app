'use strict'

// Global Variables /////////////////////////////////////////////////

// let pageNum = 1;
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

// let fs = require('fs');
// fs.writeFile('garbage.txt', '', (err => console.log('FILE ERROR', err)));

dotenv.config();

const app = express();
//console.log(process.env.PORT);
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
const RAWG_API_KEY = process.env.RAWG_API_KEY;

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
app.put('/update/:id', updateGameDetails)
app.delete('/delete/:id', deleteGame);
app.get('/inventory', getInventory);

app.delete('/hardDeleteDB', eraseDBConfirmed)
//app.post('/dbDetails', dbDetail);
//app.get('/dbDetails/routeback/:idGame', dbDetail);
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
    console.log('Unable to connect, guess we are antisocial:', err);
  });


///////////////////////////////FUNCTIONS - Page Drivers

function aboutUs (req, res) {
  res.render('aboutUs');
}



function getInventory(req, res) {

  //console.log('Fired getInventory');
  let SQL = 'SELECT * FROM gameinventorydata';
  client.query(SQL)
    .then(data => {

      let sortedData = data.rows.sort(function (a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      })
      //console.log(sortedData);
      return sortedData;
    })
    .then(data => {
      //console.log(formatDbaseData(data, 'databaseDetails'));
      res.render('viewInventory', formatDbaseData(data, 'databaseDetails'));
    });
}

function clearDatabase(req, res) {
  // console.log('clearDatabase FIRED!');
  let randomNum1 = Math.floor(Math.random() * 1000);
  let randomNum2 = Math.floor(Math.random() * 1000);
  let randomProduct = randomNum1 * randomNum2;
  // console.log('random nums', randomNum1, randomNum2);
  console.log('randomProduct', randomProduct);
  dbDeleteConfirmationKey = randomProduct;
  // let dbWipeConfirmData = { 'dbWipe': obj.detailData[0] };
  // console.log('custom', dbWipeConfirmData);
  res.render('dbWipeConfirm', { 'numTest': `${randomNum1} X ${randomNum2} = ` });
}

function eraseDBConfirmed(req, res) {
  // console.log('eraseDBConfirmed FIRED!');
  // console.log('req', req.body.testAnswer);
  let userAnswer = parseInt(req.body.testAnswer);
  // console.log ('dbDeleteConfirmKey:', dbDeleteConfirmationKey);
  // console.log('userAnswer', userAnswer, 'type of userAnswer', typeof userAnswer);
  if (userAnswer === dbDeleteConfirmationKey) {
    let SQL = 'DELETE FROM gameInventoryData;';
    client.query(SQL)
      .then(console.log('The DB has been wiped sparkling clean. Hope you meant to do that!'))
      .then(res.redirect('/inventory'))
      .catch(err => console.log('The database was not erased.', err));

  } else {
    console.log('Sending you back before you accidentally hurt yourself or your inventory data.')
    res.redirect('/inventory');
  }
}

async function viewDetails(req, res) {
  console.log('viewDetails', req.params.game_id);
  let dataRows;
  console.log('FIRED! viewDetails', req.params.game_id); //game_id: 4444444
  let SQL = 'SELECT * FROM gameinventorydata WHERE game_id=$1';
  let isInDB = false;
  await client.query(SQL, [req.params.game_id])
    .then(data => {
      if (data.rows.length > 0) {
        console.log('There is stuff to disp!');
        dataRows = data.rows;
        isInDB = true;
      }
    });
  if (isInDB) {
    // console.log('RESRENDERING FROM DATABASS');
    let dataObj = dataRows[0];
    dataObj.isInDB = isInDB;
    // console.log('isInDB should true: dataObj', dataObj);
    // console.log('dataRows', dataRows);
    let formattedDetailData = {detailData: (formatDbaseData(dataRows, 'detailData')).detailData[0]};
    // console.log('tempvar', formattedDetailData);
    res.render('details', formattedDetailData);
  }
  else {
    console.log('RESRENDERING FROM WEBPAGE');
    let secondURL = `https://api.rawg.io/api/games/${req.params.game_id}?key=230e069959414c6f961df991eb43017f`;
    console.log('Details URL', secondURL);
    await superagent(secondURL)
      .then(data => {
        //console.log('API Details', data);
        let sendToPageObj = resultToObj(data, 'detail');
        sendToPageObj.detailData.isInDB = isInDB;
        console.log('isInDB should false:', sendToPageObj);
        res.render('details', sendToPageObj);
      })
      .catch(err => console.log('View Details Could Not Be Completed.  Check your number and try again:', err));

  }

}
function updateGameButton(req, res) {


  //console.log('this is the update game', req.body.game_id);
  let SQL = `SELECT * FROM gameinventorydata WHERE game_id=${req.body.game_id};`;


  client.query(SQL)

    .then(data => {
      //console.log('this is the data', formatDbaseData(data.rows, 'databaseDetails'));
      //console.log('formatData', formatDbaseData(data.rows, 'databaseDetails'));
      res.render('update.ejs', formatDbaseData(data.rows, 'databaseDetails'));
    })
    .catch(err => console.error('Update game could not be completed', err))
}
function updateGameDetails(req, res) {
  //console.log('this is req body', req.body);
  let game = req.body;
  let SQL = 'UPDATE gameInventoryData SET name=$1, genre=$2, condition=$3, description=$4, game_count=$5, game_id=$6, image_url=$7, notes=$8, platform_id=$9, platform_name=$10, publisher=$11, release_date=$12, video_url=$13, developer=$14 WHERE game_id=$15;';
  let values = [game.name, game.genre, game.condition, game.description, game.game_count, game.game_id, game.image_url, game.notes, game.platform_id, game.platform_name, game.publisher, game.release_date, game.video_url, game.developer, game.game_id];

  //  console.log('this is value', values)
  client.query(SQL, values)
    .then(() => {
      console.log('redirecting, hold on');
      res.redirect(`/details/${game.game_id}`);
    })
    .catch(err => console.error(err));
}

//let duplicateCheck;

// eslint-disable-next-line no-unused-vars

async function addGame(req, res) {

  //console.log('FIRED! addGame', req.body.game_id, req.body.parent_page);
  // client.query('SELECT game_id FROM gameinventorydata')
  //   .then(data => {
  //     let isDuplicate = false;
  //     data.rows.map(elem =>
  //     if (elem.game_id === parseInt(req.body.game_id) { isDuplicate = true; break; }

  //     else { isDuplicate = false; }

  //     });

  console.log('(1) req.body.game_id @addGame:', req.body.game_id);

  let duplicateCheck = false;

  console.log('(2) duplicateCheck before checker', duplicateCheck);

  //call helper function to check for id in db


  let SQL = `SELECT * FROM gameInventoryData WHERE game_id=${req.body.game_id};`

  await client.query(SQL)
    .then(dbData => {
      console.log('(3) dbData exists');
      if (dbData.rows.length > 0) {
        console.log('(3.5) duplicateCheck', duplicateCheck);
        duplicateCheck = true;
        console.log('(4) @switch duplicateCheck', duplicateCheck);
      }
    })
    .catch(err => console.log('game does not exist in db or another error occurred', err));


  console.log('(5)duplicateCheck after checker', duplicateCheck);

  if (!duplicateCheck) {

    console.log('(6)duplicateCheck = ', duplicateCheck);

    let SQL = 'INSERT INTO gameinventorydata (name, genre, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url, developer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);';

    let secondURL = `https://api.rawg.io/api/games/${req.body.game_id}?key=230e069959414c6f961df991eb43017f`;
    //console.log('Add Game URL', secondURL);
    superagent(secondURL)
      .then(data => {
        return resultToObj(data, 'db');
      })
      .then(obj => {
        // eslint-disable-next-line no-unused-vars
        let { name, genre, description, game_id, image_url, platform_name, platform_id, publisher, release_date, developer, video_url } = obj.detailData;

        let values = [name, genre, 'userProvide', description, -1, game_id, image_url, 'userNotes', platform_id, platform_name, publisher, release_date, video_url, developer];
        // console.log('values:', values);
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

  } else {
    console.log('game already exists in db, returning to search page');
    hasVisited = true;
    res.redirect('/search');

  }


}

function homePage(req, res) {
  res.render('index');
}

function getSearchCriteria(req, res) {
  console.log('original URL', req.body);
  console.log('getSearchCriteria - hasVisited:', hasVisited);
  if (hasVisited) {
    console.log('Loading Previous Search Results', prevSearch);
    console.log('Setting hasVisited to FALSE');
    hasVisited = false;
    res.render('searchResults.ejs', prevSearch);
  } else {
    console.log('Loading API Search Results');
    let sURL = '';
    sURL = setURL(req.body.searchArea, req.body.searchCriteria);
    console.log('searchURL', sURL);
    superagent(sURL)
      .then(data => {
        let finalObj = resultToObj(data, 'search');
        prevSearch = finalObj;
        return finalObj
      })
      .then(obj => res.render('searchResults.ejs', obj))
      .catch(err => console.error('Unable to access RAWG games database. Or reached end of pages, you decide.', err));
  }
}

function deleteGame(req, res) {

  //console.log('FIRED! BAM! deleteGame', req.params.id);

  let SQL = `DELETE FROM gameinventorydata WHERE game_id=${req.params.id};`;
  client.query(SQL)
    .then(data => console.log('data deleted', data))
    .then(res.redirect('/inventory'))
    .catch(err => console.log('Delete did not go according to plan...', err));
}

function inventoryVerify(req, res) {
  let SQL = 'SELECT game_id, name FROM gameInventoryData';
  client.query(SQL)
    .then(data => {
      //console.log(data.rows);
      res.render('inventory', { databaseItems: data.rows });//data.rows

    });
}

function inventoryVerifyResults(req, res) {
  console.log('FIRED! inventoryVerifyResults', req.body, req.body.game_id.length, typeof (req.body.game_id));
  let isSingle = false;
  let arr = [];
  let SQL = '';
  resetInventoryVerification();
  if (typeof (req.body.game_id) === 'string') { isSingle = true; }
  (isSingle ? arr.push(req.body.game_id) : arr = req.body.game_id);
  arr.map(element => {
    // let SQL = `SELECT DISTINCT verified FROM gameInventoryData WHERE game_id=${element};`;
    //UPDATE gameInventoryData SET name=$1
    SQL = `UPDATE gameInventoryData SET verified=$1 WHERE game_id=${element};`;
    console.log(SQL);
    client.query(SQL, [true])
      .then(data => console.log(data))
      .catch(err => console.log('ERROR UPDATING VERIFICATION: ', err));
  })
  SQL = `SELECT name, game_id FROM gameInventoryData WHERE NOT (verified='true');`;
  client.query(SQL)
    .then(data => {
      console.log('DATA ROW VALUE:', data.rows);
      return data;
    })
    .then(data => {
      res.render('invResults', { invResultsData: data.rows });

    })



}
//Helper Functions

//All games for platform search: (platforms, id <= API console unique id.  Can pull from database)
//Specific Game Title: (games, <name of game>)
//Search for games release on a specific date.
function setURL(searchArea, searchCriteria, searchDate = '0000-00-00') {
  let urlSearchCritera = searchCriteria.replace(/\s/g, '%20');
  //console.log(`searchCriteria: ${searchCriteria}  Modded: ${urlSearchCritera}`);
  let appendCriteria = '';
  if (searchArea === 'date') { appendCriteria = `&dates=${searchDate}` }

  let URL = `https://api.rawg.io/api/${searchArea}?key=${RAWG_API_KEY}&search=${urlSearchCritera}&page_size=40${appendCriteria}`;
  //console.log('URL to Get:', URL);
  return URL;

}
// data is from superagent result, type is either 'detail' or 'search' or 'db'

function resultToObj(superAgentData, type = 'search') {
  //console.log(`resultToObj Formatting ${type}`);
  let data = superAgentData.body;
  let array = [];
  let appendString = '';
  let sliceAmount = 0;
  if (type === 'search') {
    data = superAgentData.body.results
    data.map((element) => {
      array.push({ name: element.name, game_id: element.id, image_url: element.background_image})
    });
    //console.log('Array', array);
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

    let video_url = `https://www.youtube.com/results?search_query=${name.replace(/\s/g, '+')}+longplay`;
    console.log('video_url', video_url);

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

    //console.log('element', element.platform_id);
    //console.log('platform_name before formatDbData:', element.platform_name);


    if (element.platform_id) { element.platform_id = element.platform_id.replace(/@/g, ' '); }
    if (element.platform_name) { element.platform_name = element.platform_name.replace(/@/g, ' '); }
    if (element.publisher) { element.publisher = element.publisher.replace(/@/g, ' '); }
    if (element.developer) { element.developer = element.developer.replace(/@/g, ' '); }
    if (element.genre) { element.genre = element.genre.replace(/@/g, ' '); }

    //console.log('platform_name after formatDbData:', element.platform_name);

  });

  return { [objName]: rowArray };
}


function textScrubber(str) {
  console.log('Type of parameter in textScrubber', typeof (str));
  console.log('String to scub:\n', str);
  let regex = /([<](.*?)[>])/g; //selects all tags
  let regex2 = /((https:\/\/)(.*?)[/])(\s)|((http:\/\/)(.*?)[/])(\s)/g; //web addresses
  let brRegex = /(<br\/>)/g;
  let finalString = str.replace(brRegex, '\n'); //changing <br/> to newlines
  console.log(finalString, '\n\nFinalString:\n');
  finalString = finalString.replace(regex, ''); //Removes all HTML tags
  finalString = finalString.replace(regex2, ''); //Removes web addresses
  return finalString;
}


async function resetInventoryVerification(req, res) {
  let SQL = `UPDATE gameInventoryData SET verified='false';`;
  await client.query(SQL)
    .then(() => {
      console.log(`SET ALL "VERIFIED" values to false`);
      res.redirect('/inventory/verify');
    })
    .catch(err => console.log('Unable to set all VERIFIED to false', err));
}

async function getLongplayVideo(req, res) {
  console.log('RandomParam', req.params.game_name);
  let gameToGet = req.params.game_name.replace(/\s/g, '+');
  console.log(gameToGet);
  // const browser = await puppeteer.launch();//({ headless: false });
  // const page = await browser.newPage({ headless: false });
  // await page.goto(`https://www.youtube.com/results?search_query=${gameToGet}+longplay`)
  // await browser.close();
  res.redirect(`https://www.youtube.com/results?search_query=${gameToGet}+longplay`);
}

async function getConsoleIds(req, res) {
  let SQL = 'INSERT INTO platforms (platform_id, platform_name) VALUES ($1, $2)';
  let URL = 'https://api.rawg.io/api/platforms/lists/parents?key=230e069959414c6f961df991eb43017f';
  let consoleDataArray = [];

  await superagent(URL)
    .then(data => {
      // console.log('console array', data.body.results.platforms);
      // console.log('console element 3:', data.body.results[2].platforms[2]);
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
    .catch(err => console.log('Unable to retrieve consoles:', err));
}

async function randomGameSuggestion(req, res) {
  let SQL = `SELECT game_Id, name, image_url FROM gameinventorydata ORDER BY RANDOM() LIMIT 1;`;
  let returnObj;
  await client.query(SQL)
    .then(data => {
      console.log('data Rows', data.rows);
      if (!data.rows[0]) {
        console.log('No Data in the database')
        returnObj = { game_id: 0, name: 'No Game Found', image_url: '404' };
      }
      else {
        returnObj = data.rows[0];
      }
    })
    .catch(err => console.log('Unable to access database for random entry:', err));
  console.log('Return OBJ:', returnObj);
  return returnObj;

}
