// backend/routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const {
  addExpense,
  deleteExpense, // Ensure this is imported
  getRoomExpenses,
  getRoomBalances,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware"); // Only protect is needed here

// Expense routes
router.post("/add", protect, addExpense);
router.delete("/:expenseId", protect, deleteExpense); // This route
router.get("/:roomId", protect, getRoomExpenses);
router.get("/:roomId/balances", protect, getRoomBalances);

module.exports = router;
