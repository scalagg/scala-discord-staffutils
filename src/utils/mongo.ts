import mongoose from 'mongoose';
import { logger } from './logger.js';
import { config } from '../config.js'; // Import your config

const mongoURI = config.database.mongodb.uri; 

export const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
};

export async function disconnect() {
    try {
        await mongoose.connection.close();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
    }
}

export const getCollection = async (collectionName: string) => {
    await connectToMongo(); // Ensure the connection is established
    return mongoose.connection.collection(collectionName);
}; 