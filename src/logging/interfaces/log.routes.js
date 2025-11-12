const express = require('express');
const config = require('../../config/config');
const Database = require('../../config/db_connection');
const KafkaConsumer = require('../infrastructure/consumer');
const KafkaProducer = require('../infrastructure/producer');
const Log = require('../domain/log.model');
const LogGenerator = require('../application/log.generator');
const path = require('path');

const app = express();
const database = new Database();
const kafkaConsumer = new KafkaConsumer();
const kafkaProducer = new KafkaProducer();
const logGenerator = new LogGenerator(kafkaProducer);

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', '..', '..', 'frontend')));

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
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/start-traffic', (req, res) => {
  const interval = req.query.interval ? parseInt(req.query.interval) : 1000;
  logGenerator.start(interval);
  res.status(200).json({ message: `Traffic generation started with interval ${interval}ms.` });
});

app.get('/stop-traffic', (req, res) => {
  logGenerator.stop();
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
      } catch (error) {
        console.error("Error inserting documents in batch callback:", error);
      }
    };

    kafkaConsumer.consumeInBatches(onBatchCallback);

    app.listen(config.api.port);
  } catch (error) {
    console.error("Error starting application:", error);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', async () => {
  logGenerator.stop();
  try {
    await kafkaConsumer.disconnect();
    await kafkaProducer.disconnect();
    await database.disconnect();
  } catch (error) {
    console.error("Error during SIGTERM shutdown:", error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logGenerator.stop();
  try {
    await kafkaConsumer.disconnect();
    await kafkaProducer.disconnect();
    await database.disconnect();
  } catch (error) {
    console.error("Error during SIGINT shutdown:", error);
  }
  process.exit(0);
});
