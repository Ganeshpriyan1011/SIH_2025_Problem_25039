require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const azureStorage = require('./services/azure-storage');

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  })
);

// ✅ Graceful Azure Storage initialization
(async () => {
  try {
    await azureStorage.initializeContainer();
    console.log('✅ Azure storage container initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Azure container:', error.message);
    // Don't crash immediately in Azure — just log it
  }
})();

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));

// ✅ Serve React frontend build (if it exists)
const frontendPath = path.join(__dirname, '../../frontend/build');
if (process.env.NODE_ENV === 'production' && require('fs').existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ✅ Azure-compatible port configuration
const PORT = process.env.PORT || 8080; // Azure assigns a dynamic port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
