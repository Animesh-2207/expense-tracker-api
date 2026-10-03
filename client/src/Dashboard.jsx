
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api/axios";

import {
  LayoutDashboard,
  Plus,
  ReceiptText,
  ChartNoAxesCombined,
  CalendarDays,
  Tags,
  UserRound,
  LogOut,
  Wallet,
  TrendingDown,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  Car,
  ShoppingBag,
  House,
  MoreHorizontal,
  X,
  Menu,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";

const categoryColors = {
  Food: "#fb6268",
  Transport: "#4d8cf5",
  Shopping: "#38c995",
  Bills: "#f5bd4f",
  Entertainment: "#8060fa",
  Education: "#aab2c2",
  Other: "#aab2c2",
};

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function dateInputValue(value) {
  if (!value) return new Date().toISOString().slice(0, 10);

  // Handles both "YYYY-MM-DD" and ISO date strings.
  return String(value).slice(0, 10);
}

function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });

  // Fetch the logged-in user's expenses.
  async function fetchExpenses() {
    try {
      setError("");

      const response = await api.get("/expenses");
      const data = response.data;

      const expenseList = Array.isArray(data)
        ? data
        : Array.isArray(data.expenses)
        ? data.expenses
        : [];

      setExpenses(expenseList);
    } catch (err) {
      console.error("Failed to load expenses:", err);

      setError(
        err.response?.data?.message ||
          "Could not load expenses. Please check your login."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Dashboard totals.
  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyTotal = expenses.reduce((sum, expense) => {
    const date = new Date(dateInputValue(expense.date) + "T00:00:00");

    if (
      date.getFullYear() === currentYear &&
      date.getMonth() === currentMonth
    ) {
      return sum + Number(expense.amount || 0);
    }

    return sum;
  }, 0);

  // Calculate monthly totals from the actual expenses.
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const amount = expenses.reduce((sum, expense) => {
      const date = new Date(dateInputValue(expense.date) + "T00:00:00");

      if (
        date.getFullYear() === currentYear &&
        date.getMonth() === index
      ) {
        return sum + Number(expense.amount || 0);
      }

      return sum;
    }, 0);

    return {
      month: new Date(currentYear, index, 1).toLocaleString("en-IN", {
        month: "short",
      }),
      amount,
    };
  });

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "All" ||
        expense.category === categoryFilter)
  );

  const categoryData = Object.entries(
    expenses.reduce((result, expense) => {
      result[expense.category] =
        (result[expense.category] || 0) +
        Number(expense.amount || 0);

      return result;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const topCategory = [...categoryData].sort(
    (a, b) => b.value - a.value
  )[0]?.name;

  function resetForm() {
    setForm({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
    });

    setEditingExpense(null);
    setShowForm(false);
    setError("");
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  // Add a new expense OR update the selected expense.
  async function addExpense(event) {
    event.preventDefault();

    if (!form.title.trim() || Number(form.amount) <= 0) {
      setError("Please enter a title and an amount greater than zero.");
      return;
    }

    const expenseData = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    };

    try {
      setError("");

      if (editingExpense) {
        // UPDATE an existing expense.
        const response = await api.put(
          `/expenses/${editingExpense.id}`,
          expenseData
        );

        const updatedExpense =
          response.data.expense || response.data;

        setExpenses((previous) =>
          previous.map((expense) =>
            String(expense.id) === String(editingExpense.id)
              ? updatedExpense
              : expense
          )
        );
      } else {
        // CREATE a new expense.
        const response = await api.post("/expenses", expenseData);

        const newExpense = response.data.expense || response.data;

        setExpenses((previous) => [newExpense, ...previous]);
      }

      resetForm();
    } catch (err) {
      console.error("Failed to save expense:", err);

      setError(
        err.response?.data?.message ||
          "Could not save expense. Please try again."
      );
    }
  }

  // Delete an expense.
  async function deleteExpense(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/expenses/${id}`);

      setExpenses((previous) =>
        previous.filter(
          (expense) => String(expense.id) !== String(id)
        )
      );
    } catch (err) {
      console.error("Failed to delete expense:", err);

      setError(
        err.response?.data?.message ||
          "Could not delete expense. Please try again."
      );
    }
  }

  // Open the same modal with the selected expense's details.
  function startEditing(expense) {
    setError("");
    setEditingExpense(expense);

    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: dateInputValue(expense.date),
    });

    setShowForm(true);
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const navItems = [
    [LayoutDashboard, "Dashboard"],
    [Plus, "Add Expense"],
    [ReceiptText, "Expenses"],
    [ChartNoAxesCombined, "Analytics"],
    [CalendarDays, "Calendar"],
    [Tags, "Categories"],
    [UserRound, "Profile"],
  ];

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}
      >
        <div className="brand">
          <span className="brand-icon">
            <ChartNoAxesCombined size={25} />
          </span>

          <span>ExpenseTrackr</span>

          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <nav className="navigation">
          {navItems.map(([Icon, label]) => (
            <button
              key={label}
              className={`nav-item ${
                label === "Dashboard" ? "active" : ""
              }`}
              onClick={() => {
                if (label === "Add Expense") {
                  openAddForm();
                } else if (label === "Expenses") {
                  setCategoryFilter("All");
                  setSearch("");
                  document
                    .getElementById("expense-search")
                    ?.focus();
                } else if (label === "Analytics") {
                  document
                    .getElementById("analytics")
                    ?.scrollIntoView({ behavior: "smooth" });
                }

                setMobileMenu(false);
              }}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✦</div>
            <strong>Make every rupee count.</strong>
            <p>Build better money habits, one day at a time.</p>
          </div>

          <button className="nav-item logout" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>

          <div className="sidebar-foot">
            PERSONAL FINANCE · {currentYear}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="top-actions">
            <button
              className="icon-button notification"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <i />
            </button>

            <div className="avatar">A</div>
            <div className="user-name">
              Animesh <span>⌄</span>
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="hero-glow" />

          <div className="hero-content">
            <div className="eyebrow">
              <span /> YOUR MONEY, IN FOCUS
            </div>

            <h1>
              Good evening, Animesh
              <span className="purple-dot">.</span>
            </h1>

            <p>
              Every small step brings you closer to your financial goals.
            </p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-coin">₹</div>

            <div className="art-card">
              <span>MONTHLY SAVINGS</span>
              <strong>+12.8%</strong>
              <div className="mini-bars">
                <i /><i /><i /><i /><i /><i /><i />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <div className="stat-icon rose">
                <Wallet />
              </div>
              <span className="stat-change negative">
                <ArrowUpRight size={15} /> 12%
              </span>
            </div>

            <p>Total tracked expenses</p>
            <h2>{currency(total)}</h2>
            <span className="stat-foot">
              Across {expenses.length} transactions
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <div className="stat-icon green">
                <TrendingDown />
              </div>
              <span className="stat-change positive">
                <ArrowDownRight size={15} /> 8%
              </span>
            </div>

            <p>This month</p>
            <h2>{currency(monthlyTotal)}</h2>
            <span className="stat-foot">
              Your spending at a glance
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <div className="stat-icon blue">
                <ChartNoAxesCombined />
              </div>
              <span className="stat-badge">TOP CATEGORY</span>
            </div>

            <p>Most spent on</p>
            <h2>{topCategory || "—"}</h2>
            <span className="stat-foot">
              Your biggest spending category
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <div className="stat-icon violet">
                <CalendarDays />
              </div>
              <span className="stat-badge">THIS MONTH</span>
            </div>

            <p>Expenses logged</p>
            <h2>{expenses.length}</h2>
            <span className="stat-foot">
              Transactions recorded
            </span>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel monthly-panel" id="analytics">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">YOUR CASH FLOW</span>
                <h3>Monthly overview</h3>
              </div>

              <span className="period-pill">
                {currentYear} <span>⌄</span>
              </span>
            </div>

            <div className="chart-legend">
              <span>
                <i className="legend-dot" /> Expenses
              </span>
              <span className="muted-legend">INR · MONTHLY</span>
            </div>

            <div className="monthly-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 12, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="#edf0f7"
                    vertical={false}
                    strokeDasharray="4 5"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8d96aa", fontSize: 11 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8d96aa", fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `${value / 1000}k`
                        : value
                    }
                  />

                  <Tooltip
                    formatter={(value) => currency(value)}
                    cursor={{ fill: "#f4f2ff" }}
                  />

                  <Bar
                    dataKey="amount"
                    fill="#7864ed"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={27}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-foot">
              <span>Monthly spending</span>
              <strong>
                {currency(total)} <small>current records</small>
              </strong>
            </div>
          </article>

          <article className="panel category-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">WHERE IT GOES</span>
                <h3>Expense breakdown</h3>
              </div>

              <button
                className="icon-button"
                aria-label="More options"
                type="button"
              >
                <MoreHorizontal />
              </button>
            </div>

            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="66%"
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          categoryColors[entry.name] ||
                          categoryColors.Other
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => currency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center">
                <strong>{currency(total)}</strong>
                <span>Total spending</span>
              </div>
            </div>

            <div className="category-legend">
              {categoryData.slice(0, 5).map((item) => (
                <div className="category-row" key={item.name}>
                  <span>
                    <i
                      style={{
                        background:
                          categoryColors[item.name] ||
                          categoryColors.Other,
                      }}
                    />
                    {item.name}
                  </span>

                  <strong>
                    {total
                      ? Math.round((item.value / total) * 100)
                      : 0}
                    %
                  </strong>
                </div>
              ))}

              {categoryData.length === 0 && (
                <p className="empty-text">
                  Add expenses to see your breakdown.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel recent-panel">
            <div className="panel-heading recent-heading">
              <div>
                <span className="section-kicker">
                  YOUR LATEST ACTIVITY
                </span>
                <h3>Recent expenses</h3>
              </div>

              <button
                className="text-button"
                onClick={() => {
                  setCategoryFilter("All");
                  setSearch("");
                  document
                    .getElementById("expense-search")
                    ?.focus();
                }}
                type="button"
              >
                View all <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="expense-toolbar">
              <div className="search-box">
                <Search size={16} />

                <input
                  id="expense-search"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                aria-label="Filter category"
              >
                <option>All</option>

                {Object.keys(categoryColors)
                  .filter((category) => category !== "Other")
                  .map((category) => (
                    <option key={category}>{category}</option>
                  ))}

                <option>Other</option>
              </select>
            </div>

            <div className="expense-list">
              {loading && (
                <div className="empty-state">Loading expenses...</div>
              )}

              {!loading &&
                filteredExpenses.slice(0, 5).map((expense) => {
                  const Icon =
                    expense.category === "Food"
                      ? Utensils
                      : expense.category === "Transport"
                      ? Car
                      : expense.category === "Shopping"
                      ? ShoppingBag
                      : expense.category === "Bills"
                      ? House
                      : ReceiptText;

                  return (
                    <div className="expense-row" key={expense.id}>
                      <div
                        className={`expense-icon ${expense.category.toLowerCase()}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="expense-description">
                        <strong>{expense.title}</strong>
                        <span>
                          {new Date(
                            dateInputValue(expense.date) + "T00:00:00"
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <span
                        className={`category-chip ${expense.category.toLowerCase()}`}
                      >
                        {expense.category}
                      </span>

                      <strong className="expense-amount">
                        −{currency(expense.amount)}
                      </strong>

                      <button
                        type="button"
                        className="icon-button"
                        title="Edit expense"
                        aria-label={`Edit ${expense.title}`}
                        onClick={() => startEditing(expense)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-button"
                        title="Delete expense"
                        aria-label={`Delete ${expense.title}`}
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

              {!loading && filteredExpenses.length === 0 && (
                <div className="empty-state">
                  No matching expenses. Try another search or add one.
                </div>
              )}
            </div>
          </article>

          <div className="right-column">
            <article className="panel quick-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">SHORTCUTS</span>
                  <h3>Quick actions</h3>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  className="quick-action purple-action"
                  onClick={openAddForm}
                  type="button"
                >
                  <Plus size={18} />
                  <span>Add expense</span>
                </button>

                <button
                  className="quick-action blue-action"
                  onClick={() => {
                    setCategoryFilter("All");
                    setSearch("");
                    document
                      .getElementById("expense-search")
                      ?.focus();
                  }}
                  type="button"
                >
                  <ReceiptText size={18} />
                  <span>View expenses</span>
                </button>

                <button
                  className="quick-action green-action"
                  onClick={() =>
                    document
                      .getElementById("analytics")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  type="button"
                >
                  <ChartNoAxesCombined size={18} />
                  <span>Analytics</span>
                </button>

                <button
                  className="quick-action amber-action"
                  onClick={openAddForm}
                  type="button"
                >
                  <Tags size={18} />
                  <span>Manage categories</span>
                </button>
              </div>
            </article>

            <article className="insight-card">
              <div className="insight-symbol">✳</div>

              <div>
                <span className="section-kicker">A LITTLE INSIGHT</span>
                <h4>Small steps add up.</h4>
                <p>
                  Tracking your daily spending helps you understand
                  where your money goes.
                </p>
              </div>
            </article>
          </div>
        </section>

        {showForm && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                resetForm();
              }
            }}
          >
            <form className="expense-modal" onSubmit={addExpense}>
              <div className="modal-heading">
                <div>
                  <span className="section-kicker">
                    STAY IN CONTROL
                  </span>

                  <h2>
                    {editingExpense
                      ? "Edit expense"
                      : "Add an expense"}
                  </h2>

                  <p>
                    {editingExpense
                      ? "Update the details of this transaction."
                      : "Record a purchase to update your dashboard."}
                  </p>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={resetForm}
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>

              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}

              <label>
                Expense title

                <input
                  required
                  maxLength={100}
                  placeholder="e.g. Lunch at cafe"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <div className="form-two-col">
                <label>
                  Amount (₹)

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Category

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                  >
                    {Object.keys(categoryColors).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Date

                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date: event.target.value,
                    })
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button type="submit" className="submit-button">
                  {editingExpense ? (
                    <>
                      <Pencil size={17} /> Save changes
                    </>
                  ) : (
                    <>
                      <Plus size={17} /> Save expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
