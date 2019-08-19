// Import express.js
const express = require('express');

// Create app object to user for creating our endpoints
const app = express();

// This sets the environment for which the project is running; defaulting to development
const environment = process.env.NODE_ENV || 'development';

// Import from knexfile the production or development object depending on the running environment
const configuration = require('./knexfile')[environment];

// Import knex
const knex = require('knex');

// Use knex configured to running environment
const database = knex(configuration);

// Run app on port based on environment or default to port 3000
app.set('port', process.env.PORT || 3000);

// Use this express.json middleware to handle json objects
app.use(express.json());

// Create title in locals to name my app
app.locals.title = 'Titan City Shipyard';

// Default endpoint to return text as response
app.get('/', (request, response) => response.send('Welcome to Titan City'));

// Log message in console when app connects to port
app.listen(app.get('port'), () =>
  console.log(
    `${app.locals.title} is running on http://localhost:${app.get('port')}.`
  )
);

// This GET endpoint returns all pilots
app.get('/api/v1/pilots', (request, response) => {
  // This variable stores strings of the columns I will soon access from the pilots table
  const pilotAttributes = [
    'id',
    'pilot_federation_id',
    'first_name',
    'last_name',
    'callsign',
    'is_wanted'
  ];
  // In the database at the pilots table
  database('pilots')
    // SELECT from these columns specified in the previous variable
    .select(...pilotAttributes)

    // then return a 200 response status with a json object of the selected data from the pilots table
    .then(pilots => response.status(200).json(pilots))
    // handle error by sending 500 status code with error message
    .catch(error => response.status(500).json({ error }));
});

// This GET endpoint returns all ships
app.get('/api/v1/ships', (request, response) => {
  // This variable stores names of the columns I will be selecting from the ships table
  const shipAttributes = ['id', 'make', 'model', 'pad_size', 'cost'];

  // Destructure manufacturer from the query in the request
  const { manufacturer } = request.query;

  // This variable stores the names of all the possible values in the make column of the ships table
  const makes = [
    'ZORGON PETERSON',
    'LAKON SPACEWAYS',
    'FAULCON DELACY',
    'SAUD KRUGER',
    'CORE DYNAMICS',
    'GUTAMAYA'
  ];

  // If the request has manufacturer query and its value is included in the array of possible values for the make column
  if (
    manufacturer &&
    makes.includes(manufacturer.toUpperCase().replace(/_/g, ' '))
  ) {
    // Access the ships table
    database('ships')
      // Select from columns specified in the shipAttributes variable
      .select(...shipAttributes)
      // Where the make of the selected data equal the response query **converted to uppercase and underscore replaced with space**
      .where('make', manufacturer.toUpperCase().replace(/_/g, ' '))

      // Then return success status code with the array of ships filtered by make
      .then(ships => response.status(200).json(ships));
    // Else, if there's a manufacturer in the request query, but its value is not included in const makes...
  } else if (manufacturer) {
    // Return 404 Not Found status code and error message
    return response.status(404).json({
      error: `No manufacturer under the name ${manufacturer
        .toUpperCase()
        .replace(/_/g, ' ')}`
    });

    // Otherwise, if there's no request query...
  } else if (!manufacturer) {
    // Access the ships table
    database('ships')
      // Select the specified columns
      .select(...shipAttributes)

      // and return an array of all ships
      .then(ships => response.status(200).json(ships))

      // handle error with 500 status code and return error json object
      .catch(error => response.status(500).json({ error }));
  }
});

// This endpoint returns all pilots with an array of all their ships in store
app.get('/api/v1/shipyard', (request, response) => {
  // Access the database...
  database

    // ...and run the following raw SQL command
    .raw(
      // Select these columns, and aggregate all data from the ships table as the variable ships
      `SELECT pilots.id AS pilot_id, pilots.pilot_federation_id, pilots.callsign, json_agg(ships.*) AS ships ` +
        // from the pilots table...
        'FROM pilots ' +
        //  joined with the pilot_ships table on the relation between id on pilots table and pilot_id on pilot_ships table
        'INNER JOIN pilot_ships ON pilots.id = pilot_ships.pilot_id ' +
        // joined also with the ships table on the relation between ship_id on the pilot_ships table and id on the ships table
        'INNER JOIN ships ON pilot_ships.ship_id = ships.id ' +
        // grouped for every id in the pilots table
        'GROUP BY pilots.id'
    )

    // then return it all
    .then(data => response.status(200).json(data.rows))

    // and handle the error
    .catch(error => response.status(500).json({ error }));
});

// this GET endpoint returns a pilot specified by ID with an array of ships with a relation to their ID in the join table
app.get('/api/v1/shipyard/:pilot_id', (request, response) => {
  // Access database...
  database

    // Using raw SQL...
    .raw(
      // Select these columns, and aggregate all data from the ships table as the variable ships as before...
      `SELECT pilots.id AS pilot_id, pilots.pilot_federation_id, pilots.callsign, json_agg(ships.*) AS ships ` +
        'FROM pilots ' +
        'INNER JOIN pilot_ships ON pilots.id = pilot_ships.pilot_id ' +
        'INNER JOIN ships ON pilot_ships.ship_id = ships.id ' +
        // Unlike before, select only the data where pilots.id equals the pilot_id specified in the request params
        `WHERE pilots.id = ${request.params.pilot_id}` +
        'GROUP BY pilots.id'
    )
    .then(data => {
      // then if the pilot owns any ship in the shipyard...
      if (data.rows.length) {
        // return success status with json object of pilot with their array of ships
        response.status(200).json(data.rows);
      } else {
        // else, return 404 Not Found status code and json error object
        response
          .status(404)
          .json({ error: 'No ships in storage under this pilot ID' });
      }
    })

    // catch all for entire function; return 500 error
    .catch(error => response.status(500).json({ error }));
});

// This GET endpoint returns a specified pilot by ID from the pilots table
app.get('/api/v1/pilots/:id', (request, response) => {
  //This variable is an array of the columns that I will be selecting from
  const pilotAttributes = [
    'id',
    'pilot_federation_id',
    'first_name',
    'last_name',
    'callsign',
    'is_wanted'
  ];
  // Select the columns as named in the array stored in the pilotAttributes variable
  database
    .select(...pilotAttributes)
    // ... From the pilots table...
    .from('pilots')
    // Only the rows where the ID matches the ID in the request parameter
    .where('id', request.params.id)
    // Then, if there are data in the pilots table that meet the criteria defined in the where clause...
    .then(pilot => {
      if (pilot.length) {
        // Return that data
        return response.status(200).json(...pilot);
      } else {
        // Otherwise, return 404 status code *Not Found
        return response.sendStatus(404);
      }
    })
    // Return 500 status code error if unsuccessful
    .catch(error => response.status(500).json({ error }));
});

// This endpoint returns a specified ship by ID from the ships table in the same manner as the previous
app.get('/api/v1/ships/:id', (request, response) => {
  const shipAttributes = ['id', 'make', 'model', 'pad_size', 'cost'];
  database
    .select(...shipAttributes)
    .from('ships')
    .where('id', request.params.id)
    .then(ship => {
      if (ship.length) {
        return response.status(200).json(...ship);
      } else {
        return response.sendStatus(404);
      }
    })
    .catch(error => response.status(500).json({ error }));
});

// This POST endpoint adds a new pilot to the pilots table in the database
app.post('/api/v1/pilots', (request, response) => {
  // Destructure pilot from the body object of the request
  const { pilot } = request.body;
  // If the body object from the request provides a pilot object in the payload...
  if (pilot) {
    // Access the pilots table from the database...
    database('pilots')
      // ...and Insert the new pilot object, add is_wanted column with default value: false; return the ID from that newly created record...
      .insert({ ...pilot, is_wanted: false }, 'id')
      // ...then return the ID in the response object
      .then(id => response.status(201).json(...id));
    // ...however, if the request body does not contain a pilot object...
  } else {
    // return a 404 error status code with message
    return response
      .status(404)
      .send({ error: 'Pilot key not present in payload.' });
  }
});

// This POST method adds a record to the pilot_ships join table
app.post('/api/v1/shipyard', (request, response) => {
  // Destructure pilot_id and ship_id from the request.body object
  const { pilot_id, ship_id } = request.body;

  // If the body object contains keys pilot_id and ship_id...
  if (pilot_id && ship_id) {
    // Access the pilot_ships table in the database
    database('pilot_ships')
      // Insert new pilot_ships entry and return the pilot_id from that new record
      .insert({ ...request.body }, 'pilot_id')
      // ...then return the ID in the response object
      .then(id => response.status(201).json(...id));
  } else {
    // return 404 status code if pilot_id and ship_id are not present in the payload
    return response
      .status(404)
      .send({ error: 'Pilot key not present in payload.' });
  }
});

// This DELETE endpoint removes a pilot from the pilots table and all child records within the pilot_ships join table
app.delete('/api/v1/pilots', (request, response) => {
  // Destructure pilot_id from the request body object
  const { pilot_id } = request.body;
  // if the request body object contains the pilot_id key
  if (pilot_id) {
    // Access pilot_ships table in the database
    database('pilot_ships')
      // only access the records where the value of in the pilot_id column match the pilot_id value from the request body
      .where('pilot_id', pilot_id)
      // delete those records
      .del()
      // then access the pilots table
      .then(() =>
        database('pilots')
          // access the record where the ID equals the pilot_id from the request body
          .where('id', pilot_id)
          // and delete that pilot record
          .del()
          // then return the ID of the deleted pilot
          .then(() => response.status(202).json(pilot_id))
      );
  } else {
    // handle error with 404 status code if pilot_id is not in the request body
    return response
      .status(404)
      .send({ error: 'pilot_id key not present in payload.' });
  }
});
