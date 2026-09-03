const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { requireAuth, requireOwner } = require('./middleware/auth.middleware');

const authRoutes = require('./routes/auth.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const paymentsRoutes = require('./routes/payments.routes');
const expensesRoutes = require('./routes/expenses.routes');
const reportsRoutes = require('./routes/reports.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (Require login)
app.use('/api/bookings', requireAuth, bookingsRoutes);
app.use('/api/payments', requireAuth, paymentsRoutes);
app.use('/api/expenses', requireAuth, expensesRoutes);
app.use('/api/reports', requireAuth, reportsRoutes);

// Protected routes (Require login AND Owner role)
app.use('/api/settings', requireAuth, requireOwner, settingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
