
// Import necessary modules
// Make sure you have 'mongoose' and 'bcryptjs' installed in your backend's package.json
// (npm install mongoose bcryptjs)

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Import your User model
// This path is relative to the location of this seed-admin.js file
// Assuming User.model.js is in C:\LiadTech\Ticket\ApplicationTicketClient\server\models
import User from '../server/models/User.model.js';

// --- Configuration ---
// IMPORTANT: Use the Docker service name 'mongo-db' for the hostname
// when running this script INSIDE the Docker container.
const mongoURI = 'mongodb://mongo-db:27017/app_ticket_db';

// Admin user details - CHANGE THESE TO YOUR DESIRED CREDENTIALS
const adminFirstName = 'Super';
const adminLastName = 'Admin';
const adminEmail = 'hmessaoudi@liadtech.com'; // <--- VERY IMPORTANT: Change this!
const adminPassword = 'liadtech123'; // <--- VERY IMPORTANT: Change this to a strong password!
const adminRole = 'admin'; // Must match one of the roles in your User schema enum

// --- Seeder Function ---
async function seedAdmin() {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(mongoURI); // Removed deprecated options
        console.log('MongoDB connected successfully.');

        // 2. Check if admin user already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`Admin user with email '${adminEmail}' already exists. Skipping creation.`);
            // Optional: If you want to update the password of an existing admin,
            // you'd add logic here, e.g.:
            // if (!(await bcrypt.compare(adminPassword, existingAdmin.password))) {
            //     existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
            //     await existingAdmin.save();
            //     console.log(`Updated password for existing admin '${adminEmail}'.`);
            // }
        } else {
            // 3. Create new admin user instance
            const newAdmin = new User({
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                password: adminPassword, // The pre-save hook in your User model will hash this
                role: adminRole
            });

            // 4. Save the admin user to the database
            await newAdmin.save();
            console.log(`Admin user '${adminEmail}' created successfully!`);
        }
    } catch (error) {
        console.error('Error seeding admin account:', error.message);
        // Log more details for debugging
        if (error.code === 11000) {
            console.error('Duplicate key error. An account with this email might already exist.');
        }
    } finally {
        // 5. Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
        process.exit(0); // Exit the process
    }
}

// Run the seeder function
seedAdmin();
