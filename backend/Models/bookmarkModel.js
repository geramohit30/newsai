const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    news: { type: mongoose.Schema.Types.ObjectId, ref: 'news', required: true },
    savedAt: { type: Date, default: Date.now }
  }, { timestamps: true });

  bookmarkSchema.index({ user: 1, news: 1 }, { unique: true });

  module.exports = mongoose.model('SavedNews', bookmarkSchema);
  