const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: false, unique: true },
    password: { type: String, required: false },
    phone : { type: String, required: false, unique: true },
    role: {type: String,enum: ["user", "admin"],default: "user",},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
