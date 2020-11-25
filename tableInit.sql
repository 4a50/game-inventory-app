DROP TABLE IF EXISTS gameInventoryData;

CREATE TABLE gameInventoryData (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(255),
  condition VARCHAR(255),
  description TEXT,
  game_count INT,
  game_id INT,
  image_url VARCHAR(255),
  notes TEXT,
  platform_id VARCHAR(255),
  platform_name VARCHAR (255),
  publisher VARCHAR(255),
  release_date VARCHAR(255),
  video_url VARCHAR(255)
);
  

DROP TABLE IF EXISTS apiData;

CREATE TABLE apiData (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(255),
  condition VARCHAR(255),
  description TEXT,
  game_count INT,
  game_id INT,
  image_url VARCHAR(255),
  notes TEXT,
  platform_id INT,
  platform_name VARCHAR (255),
  publisher VARCHAR(255),
  release_data VARCHAR(255),
  video_url VARCHAR(255)
);

DROP TABLE IF EXISTS platforms;

CREATE TABLE platforms (
  id SERIAL PRIMARY KEY,
  platform_id INT,
  platform_name VARCHAR(255)
);