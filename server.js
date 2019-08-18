const express = require('express');
const app = express();
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.set('port', process.env.PORT || 3000);
app.use(express.json());
app.locals.title = 'Titan City Shipyard';
app.get('/', (request, response) => response.send('Welcome to Titan City'));
app.listen(app.get('port'), () =>
  console.log(
    `${app.locals.title} is running on http://localhost:${app.get('port')}.`
  )
);

app.get('/api/v1/pilots', (request, response) => {
  const pilotAttributes = [
    'id',
    'pilot_federation_id',
    'first_name',
    'last_name',
    'callsign',
    'is_wanted'
  ];
  database('pilots')
    .select(...pilotAttributes)
    .then(pilots => response.status(200).json(pilots))
    .catch(error => response.status(500).json({ error }));
});

app.get('/api/v1/ships', (request, response) => {
  const shipAttributes = ['id', 'make', 'model', 'pad_size', 'cost'];
  const { manufacturer } = request.query;
  const makes = [
    'ZORGON PETERSON',
    'LAKON SPACEWAYS',
    'FAULCON DELACY',
    'SAUD KRUGER',
    'CORE DYNAMICS',
    'GUTAMAYA'
  ];
  if (
    manufacturer &&
    makes.includes(manufacturer.toUpperCase().replace(/_/g, ' '))
  ) {
  database('ships')
    .select(...shipAttributes)
      .where('make', manufacturer.toUpperCase().replace(/_/g, ' '))
      .then(ships => response.status(200).json(ships));
  } else if (manufacturer) {
    return response.status(404).json({
      error: `No manufacturer under the name ${manufacturer
        .toUpperCase()
        .replace(/_/g, ' ')}`
    });
  } else if (!manufacturer) {
    database('ships')
      .select(...shipAttributes)
    .then(ships => response.status(200).json(ships))
    .catch(error => response.status(500).json({ error }));
  }
});

app.get('/api/v1/shipyard', (request, response) => {
  database
    .raw(
      `SELECT pilots.id AS pilot_id, pilots.pilot_federation_id, pilots.callsign, json_agg(ships.*) AS ships ` +
        'FROM pilots ' +
        'INNER JOIN pilot_ships ON pilots.id = pilot_ships.pilot_id ' +
        'INNER JOIN ships ON pilot_ships.ship_id = ships.id ' +
        'GROUP BY pilots.id'
    )
    .then(data => response.status(200).json(data.rows))
    .catch(error => response.status(500).json({ error }));
});

app.get('/api/v1/shipyard/:pilot_id', (request, response) => {
  database
    .raw(
      `SELECT pilots.id AS pilot_id, pilots.pilot_federation_id, pilots.callsign, json_agg(ships.*) AS ships ` +
        'FROM pilots ' +
        'INNER JOIN pilot_ships ON pilots.id = pilot_ships.pilot_id ' +
        'INNER JOIN ships ON pilot_ships.ship_id = ships.id ' +
        `WHERE pilots.id = ${request.params.pilot_id}` +
        'GROUP BY pilots.id'
    )
    .then(data => {
      if (data.rows.length) {
        response.status(200).json(data.rows);
      } else {
        response
          .status(404)
          .json({ error: 'No ships in storage under this pilot ID' });
      }
    })
    .catch(error => response.status(500).json({ error }));
});

app.get('/api/v1/pilots/:id', (request, response) => {
  const pilotAttributes = [
    'id',
    'pilot_federation_id',
    'first_name',
    'last_name',
    'callsign',
    'is_wanted'
  ];
  database
    .select(...pilotAttributes)
    .from('pilots')
    .where('id', request.params.id)
    .then(pilot => {
      if (pilot.length) {
        return response.status(200).json(...pilot);
      } else {
        return response.sendStatus(404);
      }
    })
    .catch(error => response.status(500).json({ error }));
});

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

app.post('/api/v1/pilots', (request, response) => {
  const { pilot } = request.body;
  if (pilot) {
    database('pilots')
      .insert({ ...pilot, is_wanted: false }, 'id')
      .then(id => response.status(201).json(...id));
  } else {
    return response
      .status(404)
      .send({ error: 'Pilot key not present in payload.' });
  }
});

