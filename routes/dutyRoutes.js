// backend/routes/dutyRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrUpdateDuties,
  getDutiesTable,
  skipMemberFromCycle,
} = require("../controllers/dutyController");
const { protect, adminProtect } = require("../middleware/authMiddleware"); // Import both middlewares

// Admin-only routes for configuring and managing duties
// The `adminProtect` middleware ensures the user is an admin of the room specified by `:roomId`.
router.post("/:id/configure", protect, adminProtect, createOrUpdateDuties);
// router.put("/:id/skip-member", protect, adminProtect, skipMemberFromCycle);

// Accessible by any room member to view duties
router.get("/:id", protect, getDutiesTable);

module.exports = router;
