const mongoConnect = require('../Utils/mongo_connect');
const News = require('../Models/newsModel');

async function updateApprovedForEmptyGradients() {
  try {
    await mongoConnect();
    const result = await News.updateMany(
      {
        gradient: { $size: 0 },
        approved: true
      },
      { $set: { approved: false } }
    );

    console.log(`✅ Updated ${result.modifiedCount} documents`);
  } catch (err) {
    console.error('❌ Error updating documents:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateApprovedForEmptyGradients()