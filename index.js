require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fal = require('@fal-ai/serverless-client');
const path = require('path');

// Configure fal with API key
fal.config({ credentials: process.env.FAL_API_KEY });
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Serve static files
app.use('/generated', express.static(path.join(__dirname, 'public', 'generated')));

// Routes
const routes = require('./routes/routes');
app.use('/api', routes);

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});