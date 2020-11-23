'use strict'
const express = require('express')
const superagent = require('superagent');
const dotenv = require('dotenv');
const cors = require('cors');
const pg = require('pg');
const { render } = require('ejs');
const methodOverride = require('method-override');


dotenv.config();

const app = express();
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



function homePage(req, res) {
  let giganticArray = [];
  let outOfPages = false;
  let pageNum = 1;
  const platformId = '105';
  for (let i = 1; i < 3; i++) {
    console.log(pageNum, giganticArray, outOfPages);
    const URL = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&platforms=105&page_size=2&ordering=name&page=${pageNum}`;
    console.log('page Number before', pageNum);
    superagent(URL)

      .then(data => {
        // console.log('page Number', pageNum);
        // console.log('data', data.body.results);
        giganticArray.push('Blap');//data.body.results);
        return data;

      })
      .then(console.log('gigantic array length giganticArray', giganticArray.length))
      .then(data => res.send(data.body.results))
      .catch(err => {
        console.log('Unable to acess RAWG games database. Or reached end of pages, you decide.');
        outOfPages = true;
      });
    pageNum++;
  }

}