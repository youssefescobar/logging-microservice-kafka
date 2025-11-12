const {Kafka} = require('kafkajs')
const config = require('../configs/config');
const {Database} = require('../configs/db_connection')

class KafkaConsumer{
    constructor(){
        this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers
    });

    this.consumer = this.kafka.consumer({
        groupId: "log-group",
        maxWaitTimeInMs: 5000,
        minBytes: 1024 * 1024,
});
    this.isConnected = false;
    }

    async connect(){
    if (this.isConnected) {
      console.log('Producer already connected');
      return;
    }
        try{
            await this.consumer.connect();
            this.isConnected = true
            console.log("Kafka Consumer connected.");
        }
        catch(error){
            console.error("Failed to connect Kafka Consumer:", error);
            throw error
        }
    }

    async disconnect() {
        try {
            await this.consumer.disconnect();
            this.isConnected = false;
            console.log("Kafka Consumer disconnected.");
        } catch (error) {
            console.error("Failed to disconnect Kafka Consumer:", error);
        }
    }

    async subscribe(topic) {
        if (!this.isConnected){
            throw new Error("Consumer is not connected.")
        }
        try{
            await this.consumer.subscribe({topic: topic, fromBeginning: true})
            console.log("Subed to topic")

        }
        catch(error){
            console.error(`failed to sub to topic ${topic}`, error)
        }
    }

    async consumeInBatches(onBatchCallback) {
        if (!this.isConnected) {
            throw new Error("Consumer is not connected");
        }

        console.log("Consumer is running and waiting for batches...");

        await this.consumer.run({
            eachBatchAutoResolve: false, 
            
            eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
                
                const documents = [];
                for (const message of batch.messages) {
                    try {
                        const logData = JSON.parse(message.value.toString());
                        documents.push(logData);
                    } catch (e) {
                        console.warn("Skipping bad message (not JSON):", message.value.toString());
                        await resolveOffset(message.offset);
                    }
                }
                
                if (documents.length === 0) {
                    await heartbeat();
                    return;
                }

                try {
                    await onBatchCallback(documents);
                    await resolveOffset(batch.lastOffset());
                    console.log(`Successfully processed batch of ${documents.length} logs.`);

                } catch (error) {
                    console.error("Error processing batch:", error);
                }
                await heartbeat();
            },
        });
    }

}

module.exports = KafkaConsumer;

