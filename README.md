SmartSplitAI - Backend

📊 Overview

This repository contains the backend API for SmartSplitAI, a comprehensive expense splitting and room management application. It provides a robust and secure foundation for managing users, rooms, expenses, treasure funds, and duties, enabling seamless financial organization among groups.

✨ Features
User Authentication: Secure user registration, login, and session management using JWT.

Room Management:

Create unique rooms with short, shareable IDs.

Join existing rooms.

Manage room members (add, remove, change roles - admin-only).

Leave rooms (with debt checks).

Delete rooms (admin-only, with checks for members, expenses, and treasure transactions).

Expense Management:

Add expenses with various split types: Equal, Unequal, Percentage, and Shares.

Delete expenses (by payer or admin).

Calculate real-time balances and simplified debts within a room.

"Settle Up" debts by generating new settlement expenses.

Treasure Fund Management:

Add/Deduct funds from a shared room treasure (admin-only).

View treasure transaction history.

Delete individual treasure transactions (by creator or admin).

Duty Time Table:

Manage recurring duties for room members.

Track duty assignments and rotations.

Data Persistence: MongoDB database integration using Mongoose.

🚀 Technologies Used
Node.js: JavaScript runtime environment.

Express.js: Web application framework for Node.js.

MongoDB: NoSQL database for data storage.

Mongoose: ODM (Object Data Modeling) library for MongoDB and Node.js.

JSON Web Tokens (JWT): For secure user authentication.

Bcrypt.js: For password hashing.

express-async-handler: Simple middleware for handling exceptions in async Express routes.

CORS: Middleware for enabling Cross-Origin Resource Sharing.

Dotenv: For managing environment variables.

🛠️ Setup & Local Development
To get the backend up and running on your local machine:

Prerequisites
Node.js (LTS version recommended)

npm (Node Package Manager)

MongoDB (local installation or a cloud service like MongoDB Atlas)

Installation
Clone the repository:

git clone https://github.com/YOUR_GITHUB_USERNAME/SmartSplitAI-Backend.git
cd SmartSplitAI-Backend

(Replace YOUR_GITHUB_USERNAME with your actual GitHub username).

Install dependencies:

npm install

Create a .env file:
In the root of the backend folder, create a file named .env and add the following environment variables.

If using a local MongoDB, ensure your MongoDB server is running.

If using MongoDB Atlas, get your connection string from the Atlas dashboard.

NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartsplitai # Or your MongoDB Atlas connection string
JWT_SECRET=yourdevjwtsecret_replace_with_a_strong_random_string
FRONTEND_URL=http://localhost:5173 # Or the URL of your frontend development server

Note: JWT_SECRET should be a long, random string. FRONTEND_URL is important for CORS.

Running the Server
To start the backend server in development mode:

npm run server

The server will run on http://localhost:5000 (or your specified PORT).

🌐 API Endpoints Overview
The API provides endpoints for:

/api/users: User registration, login, user data.

/api/rooms: Room creation, joining, details, member management, room deletion, leaving.

/api/expenses: Adding, deleting, listing expenses, and calculating balances.

/api/treasure: Managing room treasure funds and transactions.

/api/duties: Managing recurring duties for rooms.

Detailed endpoint documentation (e.g., specific HTTP methods, request/response bodies) can be found by inspecting the route files in routes/ and controller functions in controllers/.
