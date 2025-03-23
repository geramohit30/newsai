const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    keywords: [String],
    data: { type: String, required: true },
    image: Object,
    article_id : { type: mongoose.Schema.Types.ObjectId, ref: 'headings', required: true }
}, { timestamps: true });

module.exports = mongoose.model('news', newsSchema);
