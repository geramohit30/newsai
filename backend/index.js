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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
