const { faker } = require('@faker-js/faker');

class LogGenerator {
  constructor(kafkaProducer) {
    this.kafkaProducer = kafkaProducer;
    this.intervalId = null;
    this.actions = [
      'login', 'logout', 'view_page', 'click_button',
      'submit_form', 'download_file', 'upload_file', 'search'
    ];
    this.devices = ['mobile', 'desktop', 'tablet'];
  }

  _createFakeLog() {
    return {
      userId: faker.string.uuid(),
      action: faker.helpers.arrayElement(this.actions),
      timestamp: new Date().toISOString(),
      metadata: {
        ip: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        device: faker.helpers.arrayElement(this.devices)
      }
    };
  }

  start(interval = 1000) {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(async () => {
      try {
        const fakeLog = this._createFakeLog();
        await this.kafkaProducer.sendLog(fakeLog);
      } catch (error) {
      }
    }, interval);
  }

  stop() {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

module.exports = LogGenerator;
