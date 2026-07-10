require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

let sequelize;

if (env === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else if (process.env.DB_NAME) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );
} else {
  console.log('PostgreSQL env variables not found. Falling back to SQLite for local development.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
