module.exports = {
  development: {
    client: 'pg',
    connection: 'postgres://localhost/shipyard',
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL + '?ssl=true',
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};
