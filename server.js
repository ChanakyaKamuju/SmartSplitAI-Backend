const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userRouter = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const treasureRoutes = require("./routes/treasureRoutes");
const dutyRoutes = require("./routes/dutyRoutes");
const Agenda = require("./agenda"); // Import Agenda for job scheduling

dotenv.config();

connectDB(); // Connect to MongoDB

// Initialize Express app
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the backend server!");
});

//UserRoutes
app.use("/api/users", userRouter);
app.use("/api/rooms", roomRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/treasure", treasureRoutes);
app.use("/api/duties", dutyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
