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

// client.connect()
// .then(() => {
console.log('Spun up the Databass');
app.listen(PORT, () => {
  console.log(`Server is working on ${PORT}`);
})
// })
// .catch(err => {
// console.log('Unable to connect, guess we are antisocial:', err);
// });

//FUNCTIONS


let URL = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&platforms=105&page_size=40&ordering=name&page=${pageNum}`;

function homePage(req, res) {

  let outOfPages = false;

  const platformId = '105';

  console.log('TimesLooped NotNull:', pageNum);
  superagent(URL)

    .then(data => {
      if (data.body.next !== null) {
        console.log('Content', data.body.next);
        URL = data.body.next;
        pageNum++;
        fs.appendFile('garbage.txt', `${data.body.next}\t${giganticArray}\n`, (err => console.log('FILE ERROR', err)));
        giganticArray.push(data.body.next);
        homePage(req, res);
      }
      else { res.send('DONE BRO!'); }

    })

    .catch(err => {
      console.log('Unable to acess RAWG games database. Or reached end of pages, you decide.');
      outOfPages = true;
    });

}

function roundAndRound(req, res, url, data) {
  // giganticArray.push(data.body.next);

}