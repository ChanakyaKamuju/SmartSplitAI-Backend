// backend/controllers/dutyController.js
const asyncHandler = require("express-async-handler");
const Duty = require("../models/Duty");
const Room = require("../models/Room");
const User = require("../models/User"); // For populating user details

// Helper function to check if two dates are the same day (ignoring time)
const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// @desc    Create or update duty configuration for a room
// @route   POST /api/duties/:roomId/configure
// @access  Private/Admin
const createOrUpdateDuties = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const { duties, memberOrder } = req.body; // duties: [{description: "..."}], memberOrder: [userIds]

  // Validate input
  if (!duties || !Array.isArray(duties) || duties.length === 0) {
    res.status(400);
    throw new Error("Please provide at least one duty.");
  }
  if (!memberOrder || !Array.isArray(memberOrder) || memberOrder.length === 0) {
    res.status(400);
    throw new Error("Please provide an order of members for duties.");
  }

  // Ensure number of duties is not greater than number of members
  if (duties.length > memberOrder.length) {
    res.status(400);
    throw new Error(
      "Number of duties cannot be greater than the number of members in the order."
    );
  }

  // Verify all memberOrder IDs are valid users and members of the room
  const room = await Room.findById(roomId).populate("members.user", "_id");
  if (!room) {
    res.status(404);
    throw new Error("Room not found.");
  }

  const roomMemberIds = room.members.map((m) => m.user._id.toString());
  const invalidMembers = memberOrder.filter(
    (id) => !roomMemberIds.includes(id)
  );
  if (invalidMembers.length > 0) {
    res.status(400);
    throw new Error(
      "One or more member IDs in the order are not valid room members."
    );
  }
  let memberIndex = 0;
  const dutyDocs = duties.map((duty) => {
    const doc = {
      description: duty.description,
      assignedTo: memberOrder[memberIndex] || null, // Assign to each member in order
      // Note: assignedTo will be updated later based on rotation logic
    };
    memberIndex++;
    return doc;
  });

  // Find existing duty configuration or create a new one
  let dutyConfig = await Duty.findOne({ roomId });

  if (dutyConfig) {
    // Update existing configuration
    dutyConfig.duties = dutyDocs;
    dutyConfig.memberOrder = memberOrder;
    // Reset rotation and skips when duties or member order changes significantly
    dutyConfig.currentStartingMemberIndex = 0;
    dutyConfig.skippedMembersForCurrentCycle = [];
  } else {
    // Create new configuration
    dutyConfig = await Duty.create({
      roomId,
      duties: dutyDocs,
      memberOrder,
      currentStartingMemberIndex: 0,
      skippedMembersForCurrentCycle: [],
    });
  }

  await dutyConfig.save();

  res.status(200).json({
    message: "Duty configuration saved successfully.",
    dutyConfig,
  });
});

// @desc    Get today's duty assignments and full duty table for a room
// @route   GET /api/duties/:roomId
// @access  Private
const getDutiesTable = asyncHandler(async (req, res) => {
  const roomId = req.params.id;

  // Check if the user is a member of the room
  const room = await Room.findById(roomId).populate(
    "members.user",
    "name email"
  );
  if (!room) {
    res.status(404);
    throw new Error("Room not found.");
  }
  const isMember = room.members.some(
    (member) => member.user._id.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error("You are not authorized to view duties for this room.");
  }

  let dutyConfig = await Duty.findOne({ roomId })
    .populate("memberOrder", "name")
    .populate("duties.assignedTo", "name");
  if (
    !dutyConfig ||
    dutyConfig.duties.length === 0 ||
    dutyConfig.memberOrder.length === 0
  ) {
    res.status(200).json({
      message: "No duties configured for this room yet.",
      allDuties: [],
      isConfigured: false,
    });
    return;
  }
  const currentUserDuty = dutyConfig.duties.find(
    (duty) =>
      duty.assignedTo &&
      duty.assignedTo._id.toString() === req.user._id.toString()
  );

  res.status(200).json({
    message: "Duties retrieved successfully.",
    currentUserDuty: currentUserDuty || null, // If user has no duty today or is skipped
    allDuties: dutyConfig.duties, // Full list of duties configured
    isConfigured: true,
  });

  //   // --- Calculate Today's Assignments ---
  //   const allMembersInOrder = dutyConfig.memberOrder; // These are populated user objects
  //   const duties = dutyConfig.duties;
  //   const currentStartingIndex = dutyConfig.currentStartingMemberIndex;
  //   const skippedMembers = dutyConfig.skippedMembersForCurrentCycle.map((id) =>
  //     id.toString()
  //   );

  //   let dutyIndex = 0; // Index for the duties array

  //   // Iterate through members starting from the current rotation index
  //   for (
  //     let i = 0;
  //     i < allMembersInOrder.length && dutyIndex < duties.length;
  //     i++
  //   ) {
  //     // Calculate the actual member index in the circular array
  //     const actualMemberIndex = currentStartingIndex % allMembersInOrder.length;
  //     const member = allMembersInOrder[actualMemberIndex];

  //     // If this member is skipped for today's cycle, increment offset and continue
  //     if (skippedMembers.includes(member._id.toString())) {
  //       continue;
  //     }

  //     // Assign the duty
  //     if (dutyIndex < duties.length) {
  //       dutyConfig.duties[dutyIndex].assignedTo = member._id; // Assign the duty to this member
  //       dutyIndex++;
  //     }
  //     // Move to the next member in the order
  //     currentStartingIndex++;
  //   }
  //   // Save the updated duty configuration
  //   await dutyConfig.save();

  // Also include the current user's duty for easy display
});

// @desc    Skip a member from the current duty cycle (Admin only)
// @route   PUT /api/duties/:roomId/skip-member
// @access  Private/Admin
const skipMemberFromCycle = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const { membersToSkip } = req.body; // membersToSkip: [userIds]

  // Validate input
  if (
    !membersToSkip ||
    !Array.isArray(membersToSkip) ||
    membersToSkip.length === 0
  ) {
    res.status(400);
    throw new Error("Please provide at least one user to skip.");
  }

  let dutyConfig = await Duty.findOne({ roomId });
  if (!dutyConfig) {
    res.status(404);
    throw new Error("Duty configuration not found for this room.");
  }

  // Check if the user to skip is actually in the memberOrder
  const isMemberInOrder = dutyConfig.memberOrder.some(
    (memberId) => memberId.toString() === userIdToSkip
  );
  if (!isMemberInOrder) {
    res.status(400);
    throw new Error("User to skip is not part of the duty member order.");
  }

  // Check if already skipped for current cycle
  if (dutyConfig.skippedMembersForCurrentCycle.includes(userIdToSkip)) {
    res.status(400);
    throw new Error("This member is already skipped for the current cycle.");
  }

  // Add member to skipped list for current cycle
  dutyConfig.skippedMembersForCurrentCycle.push(userIdToSkip);
  await dutyConfig.save();

  res.status(200).json({
    message: `Member ${userIdToSkip} skipped for the current duty cycle.`,
  });
});

module.exports = {
  createOrUpdateDuties,
  getDutiesTable,
  skipMemberFromCycle, // Export for internal use by skipMemberFromCycle
};
