require('dotenv').config({path:'/usr/src/.env'})
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
let fingerprints = [
"9B:DF:3A:95:72:13:F3:82:67:D5:D1:EB:11:61:7E:4A:55:5F:A9:33:CF:6F:17:A1:B6:92:9C:D3:ED:06:70:A4",
"93:EF:9D:AD:9E:44:B0:03:6D:74:63:D6:C7:0D:4C:D3:D5:E7:23:0E:15:5A:15:00:58:6D:72:1A:9A:9C:38:97",
"C4:08:6D:E6:D3:3A:1F:BB:59:C6:83:DA:A5:CA:F5:5C:E7:EE:BD:24:EE:1A:A8:8F:7C:46:F9:25:47:CC:AD:9A",
"8E:29:ED:49:76:71:31:41:0B:C4:E4:A8:18:75:1C:E9:71:8F:34:AE:D5:B4:76:CB:93:5F:85:C4:CB:37:45:3A"
];

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
    const assetLinksData = [{
        "relation": [
          "delegate_permission/common.handle_all_urls"
        ],
        "target": {
          "namespace": "android_app",
          "package_name": process.env.PACKAGE_NAME,
          "sha256_cert_fingerprints": fingerprints
          // [ process.env.SHA256_FINGERPRINT_1]
        }
      }];
    res.status(200).json(assetLinksData);
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
