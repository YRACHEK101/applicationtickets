import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
import config from '../config/index.js';
import initModels from '../models/sequelize/init-models.js';

// Function to seed admin user
async function seedAdminUser(models) {
  try {
    const { User } = models;
    
    // Check if admin user already exists
    const adminExists = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
      isSuspended: false,
      preferredLanguage: 'en'
    });

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Main function to run all seed operations
async function seedDatabase() {
  try {
    console.log('Seeding PostgreSQL database...');
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
    console.log('Models initialized');

    // Seed admin user
    await seedAdminUser(models);

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedDatabase();
}

export { seedAdminUser, seedDatabase };
export default seedDatabase;