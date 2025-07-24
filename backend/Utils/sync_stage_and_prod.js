const { MongoClient } = require('mongodb');

// Replace with your MongoDB URIs and settings
const sourceUri = 'mongodb+srv://root:Grg27lnjYitn2YN6@newsai.gfvpyy5.mongodb.net/newsai?retryWrites=true&w=majority&appName=newsai';
const targetUri = 'mongodb+srv://sharmashivansh0782:sharmashivansh0782@scrapping.eiwsy.mongodb.net/test?retryWrites=true&w=majority&appName=Scrapping';

const sourceDbName = 'newsai';
const sourceCollectionName = 'news';

const targetDbName = 'test';
const targetCollectionName = 'news';

async function transferData() {
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();
    console.log('✅ Connected to both source and target MongoDB');

    const sourceDb = sourceClient.db(sourceDbName);
    const sourceCollection = sourceDb.collection(sourceCollectionName);

    const targetDb = targetClient.db(targetDbName);
    const targetCollection = targetDb.collection(targetCollectionName);

    const cursor = sourceCollection.find({});
    const batchSize = 1000;
    let batch = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      batch.push(doc);

      if (batch.length >= batchSize) {
        await insertBatchSafely(targetCollection, batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatchSafely(targetCollection, batch);
    }

    console.log('✅ Data transfer completed!');
  } catch (err) {
    console.error('❌ Error during transfer:', err);
  } finally {
    await sourceClient.close();
    await targetClient.close();
    console.log('🔌 MongoDB connections closed');
    process.exit(0);
  }
}

// Insert batch and ignore duplicates
async function insertBatchSafely(collection, batch) {
  try {
    await collection.insertMany(batch, { ordered: false });
    console.log(`Inserted batch of ${batch.length}`);
  } catch (err) {
    if (err.code === 11000) {
      console.warn('⚠️ Duplicate keys found – skipping duplicates in this batch');
    } else {
      console.error('❌ Unexpected error during insert:', err);
    }
  }
}

transferData();