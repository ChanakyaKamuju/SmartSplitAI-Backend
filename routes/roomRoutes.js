// backend/routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomDetails,
  addMemberToRoom,
  removeMemberFromRoom,
  changeMemberRole,
  leaveRoom,
  deleteRoom, // Import deleteRoom
} = require("../controllers/roomController");
const { protect, adminProtect } = require("../middleware/authMiddleware");

// Public room actions (after authentication)
router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.get("/my-rooms", protect, getMyRooms);
router.get("/:id", protect, getRoomDetails);
router.put("/:id/leave", protect, leaveRoom);

// Admin-only room actions
router.put("/:id/add-member", protect, adminProtect, addMemberToRoom);
router.put("/:id/remove-member", protect, adminProtect, removeMemberFromRoom);
router.put("/:id/change-role", protect, adminProtect, changeMemberRole);
router.delete("/:id", protect, adminProtect, deleteRoom); // New route for deleting room

module.exports = router;
