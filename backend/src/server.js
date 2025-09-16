require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const azureStorage = require('./services/azure-storage');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// Initialize Azure Container
(async () => {
  try {
    await azureStorage.initializeContainer();
    console.log('Azure storage container initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Azure container:', error);
    process.exit(1);
  }
})();

// Routes
app.use('/api/auth', require('./routes/auth'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});