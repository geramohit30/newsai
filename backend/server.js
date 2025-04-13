require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./Utils/mongo_utils');

const newsRoutes = require('./Routes/newsRoute');
const authRoutes = require('./Routes/authRoute');

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use('/api', newsRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
