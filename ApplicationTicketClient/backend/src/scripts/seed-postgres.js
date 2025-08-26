import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import initModels from '../models/sequelize/init-models.js';
import config from '../config/index.js';

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
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

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
if (require.main === module) {
  seedDatabase();
}

export { seedAdminUser, seedDatabase };