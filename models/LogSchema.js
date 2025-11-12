const mongoose = require('mongoose')

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },

    action:{
        type: String,
        required: true,
        index: true,
        enum: [
      'login',
      'logout',
      'view_page',
      'click_button',
      'submit_form',
      'download_file',
      'upload_file',
      'search'
    ]
    },

    timestamp: {
    type: Date,
    required: true,
    index: true
  },

    metadata: {
    ip: String,
    userAgent: String,
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet']
    }
  },

    processedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
},
 {
    timestamps: true,
    collection: 'user_activities'

});

userActivitySchema.index({ userId: 1, timestamp: -1 }); 
userActivitySchema.index({ action: 1, timestamp: -1 }); 
userActivitySchema.index({ timestamp: -1, processedAt: -1 });



const userActivity = mongoose.model('userActivity', userActivitySchema)

module.exports = userActivity