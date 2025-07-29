const mongoose = require("mongoose");

const treasureTransactionSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"], // 'credit' for adding to treasure, 'debit' for spending from treasure
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // Do not create a default _id for subdocuments if not needed
  }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "user"], // Roles within this specific room
          default: "user",
        },
      },
    ],
    // Current total amount in the treasure fund
    treasure: {
      type: Number,
      default: 0,
    },
    treasureTransactions: [treasureTransactionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
