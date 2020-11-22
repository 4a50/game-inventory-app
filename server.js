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
  res.send('Never you mind this string.  WE are just getting started.');
}