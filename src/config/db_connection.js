const mongoose = require('mongoose');
const config = require('./config');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      this.isConnected = true;
    } catch (error) {
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
    } finally {
      this.isConnected = false;
    }
  }
}

module.exports = Database;