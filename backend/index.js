require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./Utils/mongo_utils');
const { clearFirebaseConfigCache } = require('./Config/FirebaseLimitConfig');
const newsRoutes = require('./Routes/newsRoute');
const authRoutes = require('./Routes/authRoute');
const userRoutes = require('./Routes/userRoutes')
const scrapingRoutes = require('./Routes/scrapingRoutes');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('Templates'));

connectDB();

setInterval(() => {
    console.log("Clearing Firebase config cache...");
    clearFirebaseConfigCache();
  }, 15 * 60 * 1000);

app.use('/user', userRoutes)
app.use('/api', newsRoutes);
app.use('/scrapper', scrapingRoutes)
app.use('/api/auth', authRoutes);
app.use('/health', (req, res) => {
    res.send('Server is up and running');
});
app.get('/.well-known/assetlinks.json', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const assetLinksData = {
        "relation": [
          "delegate_permission/common.handle_all_urls"
        ],
        "target": {
          "namespace": "android_app",
          "package_name": process.env.PACKAGE_NAME,
          "sha256_cert_fingerprints": [
            process.env.SHA256_FINGERPRINT_1?process.env.SHA256_FINGERPRINT_1.split(','):[]
          ]
        }
      };
    res.status(200).json(assetLinksData);
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
