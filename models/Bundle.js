const mongoose = require("mongoose");

const BundleSchema = new mongoose.Schema({
  bundle_id: { type: String, required: true, autoIncrement: true },
  title: { type: String, required: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  bundle_image: { type: String, required: true },
  images: { type: [String], required: true },
  paymentLink: { type: String, required: true },
  driveFolderId: { type: String, required: true },
  pages: { type: Number, required: true },
  category: { type: String, required: true },
  features: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bundle", BundleSchema);
