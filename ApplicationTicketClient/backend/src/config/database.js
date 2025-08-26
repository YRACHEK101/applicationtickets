import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import config from './index.js';

// Import model initializer
import initModels from '../models/sequelize/init-models.js';

// PostgreSQL connection instance
export const sequelize = new Sequelize(
  config.postgresDatabase,
  config.postgresUser,
  config.postgresPassword,
  {
    host: config.postgresHost,
    port: config.postgresPort,
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
  if (config.usePostgres) {
    try {
      await sequelize.authenticate();
      console.log('PostgreSQL Connection has been established successfully.');
      
      // Initialize all models
      console.log('Initializing Sequelize models...');
      const models = initModels(sequelize);
      
      // Export models globally
      global.models = models;
      
      // Sync models with database (in development only)
      if (config.nodeEnv === 'development') {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized');
      }
    } catch (error) {
      console.error('Unable to connect to the PostgreSQL database:', error);
      process.exit(1);
    }
  } else {
    try {
      // Legacy MongoDB connection
      const conn = await mongoose.connect(config.mongodbUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log('Error connecting to MongoDB:', error);
      process.exit(1);
    }
  }
};

export default connectDB;