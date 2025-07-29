const Duty = require("../../models/Duty");

module.exports = (agenda) => {
  agenda.define("increment duty currentIndex", async () => {
    try {
      const dutyDocs = await Duty.find().populate("memberOrder");
      console.log(dutyDocs);

      const updatePromises = dutyDocs.map(async (duty) => {
        const members = duty.memberOrder || [];
        const docs = duty.duties || [];

        if (members.length === 0 || docs.length === 0) return;

        // Step 1: Calculate next starting index
        const maxIndex = members.length - 1;
        const nextIndex =
          duty.currentStartingMemberIndex >= maxIndex
            ? 0
            : duty.currentStartingMemberIndex + 1;

        // Step 2: Rotate assignments
        const startIdx = nextIndex % members.length;
        const updatedDocs = docs.map((doc, i) => ({
          ...doc._doc, // spread original doc fields
          assignedTo: members[(startIdx + i) % members.length],
        }));

        // Step 3: Save updates
        return Duty.updateOne(
          { _id: duty._id },
          {
            $set: {
              currentStartingMemberIndex: nextIndex,
              duties: updatedDocs,
            },
          }
        );
      });

      const results = await Promise.all(updatePromises);
      console.log(
        `[Agenda] Updated ${results.filter(Boolean).length} Duty docs.`
      );
      console.log(dutyDocs);
    } catch (error) {
      console.error("[Agenda] Error updating assignedTo fields:", error);
    }
  });
};
