const expenseRoutes = require("./routes/expenses");
const authenticateToken = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://expense-tracker-api-ace-d1b4.vercel.app"
  ]
}));
app.use(express.json());
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);

// Health-check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Tracker API is running!",
  });
});

app.get("/api/protected", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You accessed a protected route!",
    userId: req.userId,
  });
});


const prisma = require("./lib/prisma");

app.get("/api/db-check", async (req, res) => {
  try {
    await prisma.$connect();

    res.status(200).json({
      success: true,
      message: "PostgreSQL connected successfully!",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});