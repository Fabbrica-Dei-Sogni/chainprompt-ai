import mongoose from 'mongoose';

export class MongoClientInstance {
  private static instance: mongoose.Connection | null = null;

  static async connect(uri: string) {
    if (!MongoClientInstance.instance) {
      await mongoose.connect(uri, { /* useNewUrlParser, useUnifiedTopology non più necessari con le versioni recenti */ });
      MongoClientInstance.instance = mongoose.connection;
      MongoClientInstance.instance.on('error', console.error.bind(console, 'MongoDB connection error:'));
    }
    return MongoClientInstance.instance;
  }

  static getConnection() {
    if (!MongoClientInstance.instance) throw new Error('MongoDB not connected');
    return MongoClientInstance.instance;
  }
}