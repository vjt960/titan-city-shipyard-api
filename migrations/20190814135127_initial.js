exports.up = knex => {
  return Promise.all([
    knex.schema.createTable('pilots', table => {
      table.increments('id').primary();
      table.integer('pilot_federation_id').unsigned();
      table.string('first_name');
      table.string('last_name');
      table.string('callsign');
      table.boolean('is_wanted');
      table.timestamps(true, true);
    }),
    knex.schema.createTable('ships', table => {
      table.increments('id').primary();
      table.string('make');
      table.string('model');
      table.string('pad_size');
      table.integer('cost').unsigned();
      table.timestamps(true, true);
    }),
    knex.schema.createTable('pilot_ships', table => {
      table.increments('id').primary();
      table.integer('pilot_id').unsigned();
      table.foreign('pilot_id').references('pilots.id');
      table.integer('ship_id').unsigned();
      table.foreign('ship_id').references('ships.id');
      table.timestamps(true, true);
    })
  ]);
};

exports.down = knex => {
  return Promise.all([
    knex.schema.dropTable('pilot_ships'),
    knex.schema.dropTable('ships'),
    knex.schema.dropTable('pilots')
  ]);
};
