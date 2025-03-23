const mongoose = require('mongoose');

const headingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: [String],
    description: { type: String, required: true },
    priority : {type: Number}
}, { timestamps: true });

module.exports = mongoose.model('headings', headingSchema);
