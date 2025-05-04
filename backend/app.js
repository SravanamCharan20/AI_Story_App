import express, { json } from 'express';
import { connect } from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import { config } from 'dotenv';

const app = express();
config();
// Middleware
app.use(json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:8081', 'http://192.168.0.105:8081'],
  credentials: true // Important for cookies
}));

// Routes
app.use('/api/user', userRoutes);

// Connect to MongoDB
connect(process.env.MONGO)
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