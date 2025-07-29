const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures email addresses are unique
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Array to store ObjectIds of rooms the user belongs to
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room", // Reference to the Room model (will be created later)
      },
    ],
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // If password is not modified, skip hashing
  }

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next(); // Proceed to save the user
  } catch (error) {
    next(error); // Pass any error to the next middleware
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
