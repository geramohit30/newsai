const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    keywords: [String],
    data: { type: String, required: true },
    approved: { type: Boolean, default: false },
    image: { type: String, required:true},
    images:[Object],
    feedId : { type: mongoose.Schema.Types.ObjectId, ref: 'rssfeed', required: true },
    categories: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('news', newsSchema);
