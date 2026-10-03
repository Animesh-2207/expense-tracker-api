
const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// CREATE an expense

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    // Validate required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, a positive amount, and category are required",
      });
    }

    // Validate date if provided
    if (date && Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date",
      });
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        amount: amount,
        category: category.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        date: date ? new Date(date) : new Date(),
        userId: req.userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
});


// READ all expenses belonging to the logged-in user

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    const where = {
      userId: req.userId,
    };

    // Filter by category if provided
    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    // Filter by starting date
    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = new Date(startDate);
      }

      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    res.json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
});


// UPDATE an expense owned by the logged-in user
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const { title, amount, category, description, date } = req.body;
    const data = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      data.title = title.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty",
        });
      }
      data.category = category.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }
      data.amount = parsedAmount;
    }

    if (description !== undefined) {
      data.description = description || null;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }
      data.date = parsedDate;
    }

    const result = await prisma.expense.updateMany({
      where: { id, userId: req.userId },
      data,
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const expense = await prisma.expense.findFirst({
      where: { id, userId: req.userId },
    });

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
});

// DELETE an expense owned by the logged-in user
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const result = await prisma.expense.deleteMany({
      where: { id, userId: req.userId },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
});


router.get("/summary/monthly", authenticateToken, async (req, res) => {
  try {
    const { month } = req.query;

    // Use YYYY-MM format, for example 2026-10
    const selectedMonth = month || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) {
      return res.status(400).json({
        success: false,
        message: "Month must be in YYYY-MM format",
      });
    }

    const [year, monthNumber] = selectedMonth.split("-").map(Number);

    if (monthNumber < 1 || monthNumber > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 01 and 12",
      });
    }

    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNumber, 1));

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const categoryTotals = {};

    for (const expense of expenses) {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    }

    res.json({
      success: true,
      month: selectedMonth,
      totalExpenses: expenses.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      categoryTotals,
    });
  } catch (error) {
    console.error("Monthly summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate monthly summary",
    });
  }
});


module.exports = router;
