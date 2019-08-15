module.exports = {
  development: {
    client: 'pg',
    connection: 'postgres://localhost/shipyard',
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};
