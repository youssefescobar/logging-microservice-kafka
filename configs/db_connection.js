const mongoose = require('mongoose');
const config = require('./config');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      this.isConnected = true;
      console.log('MongoDB connected');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error.message);
    } finally {
      this.isConnected = false;
    }
  }
}

module.exports = Database;