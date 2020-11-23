DROP TABLE IF EXISTS gamedata;

CREATE TABLE gamedata (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  publisher VARCHAR(255),  
  image_url VARCHAR(255),
  description TEXT
);
  