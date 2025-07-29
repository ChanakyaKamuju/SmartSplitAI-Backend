// backend/controllers/expenseController.js
const asyncHandler = require("express-async-handler");
const Expense = require("../models/Expense");
const Room = require("../models/Room");
const User = require("../models/User");

// @desc    Add a new expense to a room
// @route   POST /api/expenses/add
// @access  Private
const addExpense = asyncHandler(async (req, res) => {
  const { roomId, description, totalAmount, paidBy, splitType, splits } =
    req.body;

  // Validate required fields
  if (
    !roomId ||
    !description ||
    !totalAmount ||
    !paidBy ||
    !splitType ||
    !splits
  ) {
    res.status(400);
    throw new Error("Please provide all required expense details.");
  }

  // Check if the room exists and the user is a member of it
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error("Room not found.");
  }

  const isMember = room.members.some(
    (member) => member.user.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error("You are not a member of this room.");
  }

  // Validate if paidBy user is a member of the room
  const paidByUser = room.members.find((m) => m.user.toString() === paidBy);
  if (!paidByUser) {
    res.status(400);
    throw new Error('The "Paid By" user is not a member of this room.');
  }

  // Validate splits based on splitType
  let processedSplits = [];
  let totalSplitAmount = 0;
  let totalPercentage = 0;
  let totalShares = 0;

  // Ensure all users in 'splits' are members of the room
  const roomMemberIds = room.members.map((m) => m.user._id.toString());
  for (const s of splits) {
    if (!roomMemberIds.includes(s.user.toString())) {
      res.status(400);
      throw new Error(`User ${s.user} in splits is not a member of this room.`);
    }
  }

  switch (splitType) {
    case "equal":
      if (splits.length === 0) {
        res.status(400);
        throw new Error(
          "For equal split, at least one member must be specified in splits."
        );
      }
      const amountPerPerson = totalAmount / splits.length;
      processedSplits = splits.map((s) => ({
        user: s.user,
        amount: parseFloat(amountPerPerson.toFixed(2)),
      }));
      break;

    case "unequal":
      processedSplits = splits.map((s) => {
        const amount = parseFloat(s.amount);
        if (isNaN(amount) || amount <= 0) {
          res.status(400);
          throw new Error(
            "For unequal split, each member must have a valid positive amount."
          );
        }
        totalSplitAmount += amount;
        return { user: s.user, amount: parseFloat(amount.toFixed(2)) };
      });
      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        res.status(400);
        throw new Error(
          "Sum of unequal amounts does not match the total amount."
        );
      }
      break;

    case "percentage":
      processedSplits = splits.map((s) => {
        const percentage = parseFloat(s.percentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          res.status(400);
          throw new Error(
            "For percentage split, each member must have a valid percentage (0-100)."
          );
        }
        totalPercentage += percentage;
        const calculatedAmount = (totalAmount * percentage) / 100;
        return {
          user: s.user,
          percentage: percentage,
          amount: parseFloat(calculatedAmount.toFixed(2)),
        };
      });
      if (Math.abs(totalPercentage - 100) > 0.01) {
        res.status(400);
        throw new Error("Sum of percentages must be 100%.");
      }
      break;

    case "shares":
      processedSplits = splits.map((s) => {
        const sharesVal = parseFloat(s.shares);
        if (isNaN(sharesVal) || sharesVal <= 0) {
          res.status(400);
          throw new Error(
            "For shares split, each member must have a valid positive number of shares."
          );
        }
        totalShares += sharesVal;
        return { user: s.user, shares: sharesVal };
      });

      if (totalShares === 0) {
        res.status(400);
        throw new Error("Total shares cannot be zero.");
      }

      const amountPerShare = totalAmount / totalShares;
      processedSplits = processedSplits.map((s) => ({
        ...s,
        amount: parseFloat((s.shares * amountPerShare).toFixed(2)),
      }));
      break;

    default:
      res.status(400);
      throw new Error("Invalid split type.");
  }

  const expense = await Expense.create({
    roomId,
    description,
    totalAmount,
    paidBy,
    splitType,
    splits: processedSplits,
  });

  if (expense) {
    res.status(201).json({
      message: "Expense added successfully",
      expense,
    });
  } else {
    res.status(400);
    throw new Error("Invalid expense data");
  }
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:expenseId
// @access  Private (Only creator or room admin can delete)
const deleteExpense = asyncHandler(async (req, res) => {
  const expenseId = req.params.expenseId;

  const expense = await Expense.findById(expenseId);
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found.");
  }

  // Check if the user is the creator of the expense or a room admin
  const room = await Room.findById(expense.roomId);
  if (!room) {
    res.status(404); // Should not happen if expense exists
    throw new Error("Associated room not found.");
  }

  const isRoomAdmin = room.members.some(
    (member) =>
      member.user.toString() === req.user._id.toString() &&
      member.role === "admin"
  );
  const isExpenseCreator =
    expense.paidBy.toString() === req.user._id.toString();

  if (!isRoomAdmin && !isExpenseCreator) {
    res.status(403);
    throw new Error(
      "Not authorized to delete this expense. Only the creator or a room admin can delete."
    );
  }

  await expense.deleteOne(); // Use deleteOne() for Mongoose 6+

  res.status(200).json({ message: "Expense deleted successfully." });
});

// @desc    Get all expenses for a specific room
// @route   GET /api/expenses/:roomId
// @access  Private
const getRoomExpenses = asyncHandler(async (req, res) => {
  const roomId = req.params.roomId;

  // Check if the room exists and the user is a member of it
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error("Room not found.");
  }

  const isMember = room.members.some(
    (member) => member.user.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error("You are not authorized to view expenses for this room.");
  }

  // Find all expenses for the given room ID
  // Populate 'paidBy' and 'splits.user' to get user names/emails
  const expenses = await Expense.find({ roomId })
    .populate("paidBy", "name email")
    .populate("splits.user", "name email")
    .sort({ date: -1 }); // Sort by most recent first

  res.status(200).json(expenses);
});

// @desc    Calculate balances for a specific room
// @route   GET /api/expenses/:roomId/balances
// @access  Private
const getRoomBalances = asyncHandler(async (req, res) => {
  const roomId = req.params.roomId;
  console.log(`[getRoomBalances] Called for Room ID: ${roomId}`);

  // Check if the room exists and the user is a member of it
  const room = await Room.findById(roomId).populate("members.user", "name");
  if (!room) {
    console.log(`[getRoomBalances] Room ${roomId} not found.`);
    res.status(404);
    throw new Error("Room not found.");
  }

  const isMember = room.members.some(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  if (!isMember) {
    console.log(
      `[getRoomBalances] User ${req.user._id} not a member of room ${roomId}.`
    );
    res.status(403);
    throw new Error("You are not authorized to view balances for this room.");
  }

  // Get all expenses for the room
  console.log(`[getRoomBalances] Fetching expenses for room ${roomId}...`);
  const expenses = await Expense.find({ roomId })
    .populate("paidBy", "name")
    .populate("splits.user", "name");
  console.log(`[getRoomBalances] Found ${expenses.length} expenses.`);

  // Initialize balances for all members in the room
  const balances = {};
  room.members.forEach((member) => {
    balances[member.user._id.toString()] = {
      _id: member.user._id.toString(), // Include _id for easier frontend mapping
      name: member.user.name,
      amount: 0, // How much this person needs to pay or be paid
    };
    console.log(
      `[getRoomBalances] Initialized balance for ${member.user.name}: ${
        balances[member.user._id.toString()].amount
      }`
    );
  });

  // Process each expense to update balances
  expenses.forEach((expense) => {
    const paidById = expense.paidBy._id.toString();
    const totalAmount = expense.totalAmount;
    console.log(
      `[getRoomBalances] Processing expense: "${expense.description}" (Total: ${totalAmount}) paid by ${expense.paidBy.name}`
    );

    // The person who paid gets a credit
    if (balances[paidById]) {
      balances[paidById].amount += totalAmount;
      console.log(
        `  -> ${expense.paidBy.name} (PaidBy) balance after credit: ${balances[paidById].amount}`
      );
    } else {
      console.warn(
        `  -> PaidBy user ${paidById} not found in room members for balance calculation.`
      );
    }

    // Each person in the split owes their share (debit)
    expense.splits.forEach((split) => {
      const userId = split.user._id.toString();
      const owedAmount = split.amount;
      console.log(`  -> Split for ${split.user.name}: owes ${owedAmount}`);

      if (balances[userId]) {
        balances[userId].amount -= owedAmount;
        console.log(
          `    -> ${split.user.name} balance after debit: ${balances[userId].amount}`
        );
      } else {
        console.warn(
          `  -> Split user ${userId} not found in room members for balance calculation.`
        );
      }
    });
  });

  // Convert balances object to an array for easier processing/display
  let balanceArray = Object.values(balances);
  console.log(
    "[getRoomBalances] Raw Balances before simplification:",
    balanceArray.map((b) => `${b.name}: ${b.amount}`)
  );

  // Create a copy of the balanceArray before it's modified by simplification
  const rawBalancesCopy = balanceArray.map((b) => ({ ...b })); // Deep copy for objects

  // Simplify debts: Determine who owes whom
  const simplifiedDebts = [];
  const creditors = balanceArray
    .filter((b) => b.amount > 0)
    .sort((a, b) => b.amount - a.amount); // Owed money
  const debtors = balanceArray
    .filter((b) => b.amount < 0)
    .sort((a, b) => a.amount - b.amount); // Owes money

  let i = 0; // Pointer for debtors
  let j = 0; // Pointer for creditors

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amountToSettle = Math.min(Math.abs(debtor.amount), creditor.amount);

    if (amountToSettle > 0.01) {
      // Only add settlement if amount is significant
      simplifiedDebts.push({
        from: debtor.name,
        to: creditor.name,
        amount: parseFloat(amountToSettle.toFixed(2)), // Format to 2 decimal places
      });
    }

    debtor.amount += amountToSettle; // Debtor pays off some debt
    creditor.amount -= amountToSettle; // Creditor receives some payment

    // Move pointers
    if (Math.abs(debtor.amount) < 0.01) {
      // Debtor has paid off their debt
      i++;
    }
    if (creditor.amount < 0.01) {
      // Creditor has been paid back
      j++;
    }
  }
  console.log("[getRoomBalances] Simplified Debts:", simplifiedDebts);

  res.status(200).json({
    rawBalances: rawBalancesCopy.map((b) => ({
      _id: b._id,
      name: b.name,
      amount: parseFloat(b.amount.toFixed(2)),
    })), // Include _id
    simplifiedDebts: simplifiedDebts,
  });
});

module.exports = {
  addExpense,
  deleteExpense, // Export the new function
  getRoomExpenses,
  getRoomBalances,
};
