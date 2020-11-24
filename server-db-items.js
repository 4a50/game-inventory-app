//storing game data to inventory db
let SQL = 'INSERT INTO gameInventoryData (title, category, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
let values = [//enter values here to access data from API example: req.body.title];
client.query (SQL, values)
  .then(do something)


// storing search results to the apiData db
let SQL = 'INSERT INTO apiData (title, category, condition, description, game_count, game_id, image_url, notes, platform_id, platform_name, publisher, release_date, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
let values = [//enter values here to access data from API example: req.body.title];
client.query (SQL, values)
  .then(do something)


//display all data from inventory database
let SQL = 'SELECT * FROM gameInventoryData;';
client.query(SQL);
  .then(do something)


//display single game details from inventory db
let SQL = 'SELECT * FROM gameInventoryData WHERE id=$1;';
let values = [//enter values from user example: req.params.id];
client.query(SQL, values)
  .then (do something)


//display list of games by platform from inventory db - similar setup could be used for the following search criteria: category, condition, platform_name, publisher, release_date
let SQL = 'SELECT * FROM gameInventoryData WHERE platform_name=$1;';
let values = [//enter values from user example: req.params.id];
client.query(SQL, values)
  .then (do something)


//to update game details in inventory
let SQL = 'UPDATE gameInventoryData SET title=$1, category=$2, condition=$3, description=$4, game_count=$5, game_id=$6, image_url=$7, notes=$8, platform_id=$9, platform_name=$10, publisher=$11, release_date=$12, video_url=$13) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);';
let values = [//enter values here to access data user example: req.body.title];
client.query (SQL, values)
  .then(do something)


//to remove a game from inventory
let SQL = 'DELETE FROM gameInventoryData WHERE id=$1;';
let values = [//enter values from user example: req.params.id];
client.query(SQL, values) 
  .then (do something)
