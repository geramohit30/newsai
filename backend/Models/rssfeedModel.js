const mongoose = require('mongoose');

const rssfeedSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: [String],
    description: { type: String, required: true },
    priority : {type: Number},
    success:  { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('rssfeed', rssfeedSchema);
