const mongoose = require('mongoose');

const apiCallSchema = new mongoose.Schema({
    count: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  });
module.exports = mongoose.model('ChatGPTApiCall', apiCallSchema);