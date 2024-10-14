require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fal = require('@fal-ai/serverless-client');
const path = require('path');
const { connectToDatabase, saveDataToMongoDB } = require('./your_mongodb_file');

// Configure fal with API key
fal.config({ credentials: process.env.FAL_API_KEY });
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  'https://coloring-book-frontend.vercel.app',
  'https://coloring-book-frontend-jqluztz5g-mandybuoys-projects.vercel.app',
  // Add any other origins you want to allow
];

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in the environment variables");
  process.exit(1);
}

connectToDatabase()
  .then(() => {
    console.log("Database connected successfully");
    return saveDataToMongoDB('Coloring-Book-database-v1', { name: 'test' });
  })
  .then(() => {
    console.log("Test data saved successfully");
  })
  .catch((error) => {
    console.error("Failed to connect to database or save test data:", error);
    process.exit(1);
  });

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
