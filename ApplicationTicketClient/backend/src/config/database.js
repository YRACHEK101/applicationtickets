import mongoose from 'mongoose';
import config from './index.js';

const connectDB = async () => {
  try {
    // Remove the deprecated options
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;