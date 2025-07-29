// backend/models/Expense.js
const mongoose = require("mongoose");

// Define the schema for how an expense is split among members
const splitSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Amount owed/contributed by this user for this specific split type
    amount: {
      type: Number,
      // Required for 'unequal' split type, optional for others if calculated
      // Will be calculated for 'equal', 'percentage', 'shares'
    },
    // For 'percentage' split type
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      // Required if splitType is 'percentage'
    },
    // For 'shares' split type
    shares: {
      type: Number,
      min: 0,
      // Required if splitType is 'shares'
    },
  },
  {
    _id: false, // Do not create a default _id for subdocuments
  }
);

// Define the main Expense schema
const expenseSchema = mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01, // Ensure amount is positive
    },
    // The user who initially paid the total amount
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Type of splitting: equal, unequal, percentage, shares
    splitType: {
      type: String,
      enum: ["equal", "unequal", "percentage", "shares"],
      required: true,
    },
    // Array of how the expense is split among participating members
    splits: [splitSchema],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model("Expense", expenseSchema);
