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
  database('ships')
    .select(...shipAttributes)
    .then(ships => response.status(200).json(ships))
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
