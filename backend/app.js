const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const dotenv = require('dotenv')

const app = express();
dotenv.config();
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://192.168.26.67:8081', // Replace with your Expo app URL
  credentials: true // Important for cookies
}));

// Routes
app.use('/api/user', userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 