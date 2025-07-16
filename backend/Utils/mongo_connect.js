const mongoose = require('mongoose');
const connectDB = require('./mongo_utils');

async function mongoConnect() {
  if (mongoose.connection.readyState !== 1) {
    console.warn("MongoDB not connected. Attempting to connect...");
    await connectDB();
    return mongoose.connection;
  } else {
    console.log("✅ MongoDB is already connected.");
    return mongoose.connection;
  }
}

module.exports = mongoConnect;
