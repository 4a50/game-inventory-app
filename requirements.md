# Software Requirements:

## Vision
  - **To create an easy to use app to manage inventory of small to large video game collections.**
  - Gaming has become an integral part of mainstream activities with the amount of titles available. There is a significant amount of people with a large collection, especially in our generation, which is the first generation to grow up with mainstream video games. We are now using our video game collections as a piece of nostalgia from our childhood, and need an easy to use, accessible way to keep track of the ones we currently own and ones we still need to acquire. This app solves the pain point of having to pull information from multiple different apps/websites that all have different information, and pull it into one place. 

## Scope in/out
  - **IN: what will the product do?**
    1. It will reach out to an API and gather requested game information.
    2. It will store selected game information into a database for later retrieval and use.
    3. The app will allow the user to update game details within their stored data, as well as delete games from inventory, and prevent duplication of line entries.
    4. App will display pertinent game information and details when selected, and if it's in the inventory, will allow updating from that page.
    5. Provide an efficient way to perform an inventory of games, using the same database.
    
  - **OUT: what will the app not do?**
    1. Will not store actual video games.
    2. Will not provide information for downloading of video game ROM.
    
  - **MVP**
    1. Essentially what is listed above, 1-5 of scope IN tasks.
    
  - **Stretch Goals**
    1. Barcode Scanner capability
    2. Video clip capability (or link to long plays)
    3. Export the database to file (CSV or PDF)
    4. Price charting API (link to site to purchase game if not in inventory)
    5. Using Foreign keys to create relationships across tables in a database

## Functional Requirements
  - A user can search and display video game data from an API, sort in various ways, and put all selected information into database.
  - Database will be able to store, update, and delete game data from inventory
  
  - **Data Flow**
    1. See wire frame for details

## Non-functional Requirements
  1. User Interface: will be intuitive by design and will not require a tutorial. We will design a simple and clear layout that is easy to follow, and test the ease of design throughout the development process to ensure easy navigation for users other than the developers.
  2. Extensibility: will allow for app to be updated and redesigned in the future, with other features able to be implemented. We will add comments into the code to point to areas where changes can be made, and keep the code as modular as possible/using as descriptive of variable names as possible to make it easier to continue with features at a later date.

