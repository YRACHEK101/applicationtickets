import { Sequelize } from 'sequelize';
import config from '../config/index.js';
import initModels from '../models/sequelize/init-models.js';

async function createTables() {
  try {
    console.log('Creating PostgreSQL tables...');
    console.log(`Connection parameters: ${config.postgresHost}:${config.postgresPort}/${config.postgresDatabase}`);
    
    const sequelize = new Sequelize(config.postgresDatabase, config.postgresUser, config.postgresPassword, {
      host: config.postgresHost,
      port: config.postgresPort,
      dialect: 'postgres',
      logging: console.log
    });

    // Test connection
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    
    // Initialize models
    const models = initModels(sequelize);
    console.log('Models initialized successfully.');
    
    // Sync all models with database (create tables)
    console.log('Creating database tables...');
    await sequelize.sync({ force: true });
    console.log('All tables have been successfully created.');
    
    await sequelize.close();
    console.log('Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to create PostgreSQL tables:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  createTables();
}

export default createTables;