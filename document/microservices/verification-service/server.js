const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/verification_db')
.then(() => console.log('Connected to Verification Database'))
.catch(err => console.error('Database connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'healthy',
    service: 'verification-service',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Routes
const verificationRoutes = require('./routes/verification');
app.use('/verification', verificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      service: 'verification-service',
      timestamp: new Date().toISOString()
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Verification service error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      service: 'verification-service',
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`Verification Service running on port ${PORT}`);
});