const express = require('express');
const config = require('../configs/config');
const Database = require('../configs/db_connection');
const KafkaConsumer = require('../kafka/consumer');
const KafkaProducer = require('../kafka/producer');
const Log = require('../models/LogSchema');
const TrafficGenerator = require('../utils/traffic_generator');
const path = require('path');

const app = express();
const database = new Database();
const kafkaConsumer = new KafkaConsumer();
const kafkaProducer = new KafkaProducer();
const trafficGenerator = new TrafficGenerator(kafkaProducer);

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, action, startDate, endDate } = req.query;
    const query = {};

    if (userId) {
      query.userId = userId;
    }
    if (action) {
      query.action = action;
    }
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const logs = await Log.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    const totalLogs = await Log.countDocuments(query);

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalLogs / limit),
      totalLogs,
      logs,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/start-traffic', (req, res) => {
  const interval = req.query.interval ? parseInt(req.query.interval) : 1000;
  trafficGenerator.start(interval);
  res.status(200).json({ message: `Traffic generation started with interval ${interval}ms.` });
});

app.get('/stop-traffic', (req, res) => {
  trafficGenerator.stop();
  res.status(200).json({ message: 'Traffic generation stopped.' });
});


const start = async () => {
  try {

    await database.connect();
    await kafkaProducer.connect();
    await kafkaConsumer.connect();
    await kafkaConsumer.subscribe(config.kafka.topic);

    const onBatchCallback = async (documents) => {
      try {
        await Log.insertMany(documents);
        console.log(`Successfully saved ${documents.length} logs to MongoDB.`);
      } catch (error) {
        console.error('Error saving logs to MongoDB:', error);
      }
    };

    kafkaConsumer.consumeInBatches(onBatchCallback);

    app.listen(config.api.port, () => {
      console.log(`API Gateway running on port ${config.api.port}`);
    });
  } catch (error) {
    console.error('Failed to start the API Gateway:', error);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  trafficGenerator.stop();
  await kafkaConsumer.disconnect();
  await kafkaProducer.disconnect();
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  trafficGenerator.stop();
  await kafkaConsumer.disconnect();
  await kafkaProducer.disconnect();
  await database.disconnect();
  process.exit(0);
});

