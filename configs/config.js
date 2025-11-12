require('dotenv').config();

module.exports = {
  kafka: {
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : [],
    clientId: process.env.KAFKA_CLIENT_ID || 'default-client',
    topic: process.env.KAFKA_TOPIC || 'user-activity-logs'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/event-logs?authSource=admin',
    options: {}
  },
  api: {
    port: process.env.API_PORT || 3000
  }
};
