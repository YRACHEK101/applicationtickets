import { sequelize } from '../config/database.js';
import initModels from '../models/sequelize/init-models.js';
import config from '../config/index.js';

async function testPostgresConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    console.log(`Connection parameters: ${config.postgresHost}:${config.postgresPort}/${config.postgresDatabase}`);
    
    // Test connection
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    
    // Initialize models
    const models = initModels(sequelize);
    
    // List all models
    console.log('\nAvailable models:');
    Object.keys(models).forEach(modelName => {
      console.log(`- ${modelName}`);
    });
    
    // Test a simple query
    console.log('\nTesting a simple query...');
    const userCount = await models.User.count();
    console.log(`Number of users in database: ${userCount}`);
    
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the PostgreSQL database:', error);
    process.exit(1);
  }
}

// Run the test function
testPostgresConnection();