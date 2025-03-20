// server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fal from "@fal-ai/serverless-client";
import { connectToDatabase } from "./db.js";
import routes from "./routes/routes.js";

dotenv.config();

// Configure fal with API key
fal.config({ credentials: process.env.FAL_API_KEY });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Routes

app.use("/api", routes);

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", details: err.message });
});

// Connect to MongoDB before starting the server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
