const {Kafka} = require('kafkajs')
const config = require('../../config/config');
const {Database} = require('../../config/db_connection')

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
      return;
    }
        try{
            await this.consumer.connect();
            this.isConnected = true
            console.log('Kafka consumer connected');
        }
        catch(error){
            console.error('Kafka consumer connection error:', error);
            throw error
        }
    }

    async disconnect() {
        try {
            await this.consumer.disconnect();
            this.isConnected = false;
        } catch (error) {
            console.error("Error disconnecting Kafka consumer:", error);
        }
    }

    async subscribe(topic) {
        if (!this.isConnected){
            throw new Error("Consumer is not connected.")
        }
        try{
            await this.consumer.subscribe({topic: topic, fromBeginning: true})
            console.log(`Subscribed to topic: ${topic}`);

        }
        catch(error){
            console.error("Error subscribing to Kafka topic:", error);
        }
    }

    async consumeInBatches(onBatchCallback) {
        if (!this.isConnected) {
            throw new Error("Consumer is not connected");
        }


        await this.consumer.run({
            eachBatchAutoResolve: false, 
            
            eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
                console.log(`Processing batch of ${batch.messages.length} messages`);
                const documents = [];
                for (const message of batch.messages) {
                    try {
                        const logData = JSON.parse(message.value.toString());
                        documents.push(logData);
                    } catch (e) {
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

                } catch (error) {
                    console.error("Error processing batch:", error);
                }
                await heartbeat();
            },
        });
    }

}

module.exports = KafkaConsumer;

