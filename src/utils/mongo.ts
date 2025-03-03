import { MongoClient } from 'mongodb';
import { logger } from './logger.js';
import { config } from '../config.js'; // Import your config

const client = new MongoClient(config.database.mongodb.uri); // Use the URI from the config

export async function connect() {
    try {
        await client.connect(); // Connect to the MongoDB server
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
}

export async function disconnect() {
    try {
        await client.close();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
    }
}

export async function getCollection(collectionName: string) {
    await connect(); // Ensure the client is connected
    return client.db('PotPvP').collection(collectionName);
} 