const { Agenda } = require("agenda");
require("dotenv").config();

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URI, // Replace with actual DB name
    collection: "agendaJobs",
  },
});

// Load job definitions
require("./jobs/incrementDutyIndex")(agenda);

(async function () {
  await agenda.start();

  // Run job daily at 12:00 AM
  await agenda.every("0 0 * * *", "increment duty currentIndex");
  //   await agenda.every("1 minute", "increment duty currentIndex");
})();

module.exports = agenda;
