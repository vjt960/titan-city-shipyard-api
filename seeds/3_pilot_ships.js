const createShipyard = (knex, pilot, ships) => {
  return knex('pilot_ships').insert({
    pilot_id: pilot,
    ship_id: ships[Math.floor(Math.random() * ships.length)]
  });
};

exports.seed = knex => {
  let allPilots = [];
  let allShips = [];
  return knex('pilot_ships')
    .del()
    .then(() => knex.table('pilots').pluck('id'))
    .then(pilots => (allPilots = [...pilots]))
    .then(() => knex.table('ships').pluck('id'))
    .then(ships => (allShips = [...ships]))
    .then(() => {
      return Promise.all(
        allPilots.reduce((shipyardPromises, pilot) => {
          shipyardPromises.push(createShipyard(knex, pilot, allShips));
          return shipyardPromises;
        }, [])
      );
    })
    .catch(error => console.log(`Error seeding data: ${error}`));
};
