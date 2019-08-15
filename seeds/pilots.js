const pilotsData = require('../default_data/pilots_data');

const createPilot = (knex, pilot) => {
  return knex('pilots').insert({
    pilot_federation_id: pilot.serial,
    first_name: pilot.first,
    last_name: pilot.surname,
    callsign: pilot.callsign,
    is_wanted: pilot.blacklist
  });
};

exports.seed = knex => {
  return knex('pilots')
    .del()
    .then(() => {
      return Promise.all(
        pilotsData.reduce((pilotPromises, pilot) => {
          pilotPromises.push(createPilot(knex, pilot));
          return pilotPromises;
        }, [])
      );
    })
    .catch(error => console.log(`Error seeding data: ${error}`));
};
