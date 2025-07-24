const { MongoClient } = require('mongodb');

// Replace with your MongoDB connection string
const uri = 'mongodb+srv://sharmashivansh0782:sharmashivansh0782@scrapping.eiwsy.mongodb.net/?retryWrites=true&w=majority&appName=Scrapping';
const dbName = 'test';
const collectionName = 'news';

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const count = await collection.countDocuments();

    console.log(`📰 Total articles count: ${count}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();