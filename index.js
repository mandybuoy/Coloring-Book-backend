import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fal from "@fal-ai/serverless-client";
import path from "path";
dotenv.config();

// Configure fal with API key
fal.config({ credentials: process.env.FAL_API_KEY });
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  "https://coloring-book-frontend.vercel.app",
  "https://coloring-book-frontend-jqluztz5g-mandybuoys-projects.vercel.app",
  "http://localhost:3000",
  "https://printablesforall.com",
  "http://localhost:8080",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is a Chrome extension
    if (origin.startsWith("chrome-extension://")) {
      return callback(null, true);
    }

    // Check if the origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Serve static files
app.use(
  "/generated",
  express.static(path.join(__dirname, "public", "generated"))
);

// Routes
const routes = require("./routes/routes");
app.use("/api", routes);

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal Server Error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

// Connect to MongoDB before starting the server
// connectToDatabase()
//   .then(() => {
//     console.log("Database connected successfully");
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("Failed to connect to database:", error);
//     console.error("Error details:", JSON.stringify(error, null, 2));
//     process.exit(1);
//   });
