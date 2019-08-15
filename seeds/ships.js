const shipsData = require('../default_data/ships_data');

const createShip = (knex, ship) => {
  return knex('ships').insert({
    make: ship.make,
    model: ship.model,
    pad_size: ship.pad_size,
    cost: ship.cost
  });
};

exports.seed = knex => {
  return knex('ships')
    .del()
    .then(() => {
      return Promise.all(
        shipsData.reduce((shipsPromises, ship) => {
          shipsPromises.push(createShip(knex, ship));
          return shipsPromises;
        }, [])
      );
    })
    .catch(error => console.log(`Error seeding data: ${error}`));
};
