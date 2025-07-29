const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import the User model
const Room = require("../models/Room"); // Import the Room model

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (format: "Bearer TOKEN")
      token = req.headers.authorization.split(" ")[1];

      // Verify token using the JWT_SECRET from environment variables
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the decoded token and attach to request object
      // .select('-password') excludes the password field from the returned user object
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Move to the next middleware or route handler
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // If no token is found
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware to check if the user has an 'admin' role within a specific room
// This will be more complex and implemented later, as it depends on room context.
// For now, we'll just export the protect middleware.
// We'll refine this when we implement room-specific roles.
const adminProtect = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not Authenticated" });
  }

  const roomId = req.params.id || req.body.roomId;

  if (!roomId) {
    return res.status(400).json({ message: "Room ID is required" });
  }

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const member = room.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (member && member.role === "admin") {
      // Attach the room object to the request for later use in the controller
      req.room = room;
      next(); // User is an admin, proceed
    } else {
      res
        .status(403)
        .json({ message: "Not authorized as an admin of this room." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { protect, adminProtect };
