import mongoose from 'mongoose';
import { createClient } from 'redis';
import logger from './logger';

class Database {
  private static instance: Database;
  private mongoConnection: typeof mongoose | null = null;
  private redisClient: any = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connectMongoDB(): Promise<void> {
    try {
      const mongoUri = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_TEST_URI! 
        : process.env.MONGODB_URI!;

      this.mongoConnection = await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });

      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  public async connectRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
        }
      });

      this.redisClient.on('error', (error: Error) => {
        logger.error('Redis connection error:', error);
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Redis connection failed:', error);
    }
  }

  public getRedisClient() {
    return this.redisClient;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  }
}

export default Database.getInstance();