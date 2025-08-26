import { Sequelize } from 'sequelize';
import config from './index.js';

const sequelize = new Sequelize(
  config.postgresDatabase || 'app_ticket_db',
  config.postgresUser || 'postgres',
  config.postgresPassword || 'postgres',
  {
    host: config.postgresHost || 'postgres-db',
    port: config.postgresPort || 5432,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the PostgreSQL database:', error);
    process.exit(1);
  }
};

export { sequelize };
export default connectDB;