const mongoose = require('mongoose');

const scraperLockSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, index: { expires: 3600 } }
});

module.exports = mongoose.model('ScraperLock', scraperLockSchema);
