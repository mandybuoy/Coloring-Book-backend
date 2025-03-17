const mongoose = require("mongoose");
require("dotenv").config();

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed", error);
    throw error;
  }
};

module.exports = { connectToDatabase };
