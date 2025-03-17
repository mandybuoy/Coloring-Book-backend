const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  bundle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bundle",
    required: true,
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentId: {
    type: String,
    required: true,
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
