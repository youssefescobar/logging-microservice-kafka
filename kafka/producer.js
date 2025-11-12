const { Kafka } = require('kafkajs');
const config = require('../configs/config')

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
      console.log('Producer already connected');
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('kafka Producer connected');
    } catch (error) {
      console.error('failed to connect producer:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('Producer disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error.message);
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
            console.log(`Sent: ${logdata.action} | User: ${logdata.userId.slice(0, 8)}`);
        return result;
    } catch (error) {
      console.error('Error: ', error.message);
      throw error;
    }
    }
}

module.exports = KafkaProducer;