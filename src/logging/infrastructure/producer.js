const { Kafka } = require('kafkajs');
const config = require('../../config/config')

class KafkaProducer {
     constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers
    });
    
    this.producer = this.kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Kafka producer connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
    } catch (error) {
      console.error("Error disconnecting Kafka producer:", error);
    }
  }

  async sendLog(logdata){
    if (!this.isConnected){
        throw new Error('Producer not connected')
    }
    try {
        const result = await this.producer.send({
            topic: config.kafka.topic,
            messages: [
                {
                    key: logdata.userId,
                    value: JSON.stringify(logdata),
                    timestamp: Date.now().toString()
                }
            ]
        });
        return result;
    } catch (error) {
      console.error('Error sending log to Kafka:', error);
      throw error;
    }
    }
}

module.exports = KafkaProducer;