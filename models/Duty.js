// backend/models/Duty.js
const mongoose = require("mongoose");

// Schema for individual duty items
const dutyItemSchema = mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      default: null, // Initially no one is assigned
    },
    // The order of duties is implicitly determined by their index in the 'duties' array
  },
  { _id: true }
); // MongoDB will automatically generate _id for each duty item

// Main Duty schema
const dutySchema = mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true, // Ensures only one duty configuration per room
    },
    duties: [dutyItemSchema], // Array of duty objects (description, _id)
    memberOrder: [
      {
        // Ordered list of members for duty assignment cycle
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Index in the 'memberOrder' array indicating which member gets the *first* duty for the current cycle
    currentStartingMemberIndex: {
      type: Number,
      default: 0,
    },
    // Members explicitly skipped for the *current* cycle. This array should be cleared on new rotation.
    // These are user IDs of members who will be skipped for today's assignment.
    skippedMembersForCurrentCycle: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model("Duty", dutySchema);
