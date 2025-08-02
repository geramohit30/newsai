const mongoose = require('mongoose');
require('dotenv').config({path:'/usr/src/.env'});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
        });
        console.log('MongoDB Connected...');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
