URL-https://expense-tracker-56yy6260j-ace-d1b4.vercel.app/login

# Personal Expense Tracker API

A RESTful backend API for managing personal expenses, built using Node.js, Express.js, PostgreSQL, Prisma ORM, and JWT authentication.

## Features

- User registration and login
- JWT-based authentication
- Create, view, update, and delete expenses
- Filter expenses by category and date range
- Monthly expense summaries
- Input validation
- User-specific expense access

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JSON Web Tokens (JWT)
- bcryptjs

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd expense-tracker-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/expense_tracker?schema=public"
   JWT_SECRET="YOUR_RANDOM_SECRET"
   PORT=3000
   ```

   Replace the placeholders with your local PostgreSQL credentials and a securely generated JWT secret. Never commit your real `.env` file.

4. Apply database migrations:

   ```bash
   npx prisma migrate deploy
   ```

5. Generate the Prisma client if needed:

   ```bash
   npx prisma generate
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

## API Endpoints

All expense endpoints require this header:

`Authorization: Bearer YOUR_JWT_TOKEN`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/expenses` | Create an expense |
| GET | `/api/expenses` | Get expenses |
| GET | `/api/expenses?category=Food` | Filter by category |
| GET | `/api/expenses?startDate=2026-10-01` | Filter by starting date |
| GET | `/api/expenses/summary/monthly?month=2026-10` | Get monthly summary |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |

## Project Status

Core CRUD operations, authentication, expense filtering, monthly summaries, and basic input validation have been implemented and tested locally.

## Future Improvements

- Automated tests
- API documentation with Swagger
- Pagination
- Deployment to a hosting platform

## Author

Animesh Raj
