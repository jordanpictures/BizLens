const db = require("../db");

exports.getReports = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    let dateFilter = "";
    let prevDateFilter = "";

    if (period === "today") {
      dateFilter = `WHERE date >= CURRENT_DATE`;
      prevDateFilter = `WHERE date >= CURRENT_DATE - INTERVAL '1 day' AND date < CURRENT_DATE`;
    } else if (period === "week") {
      dateFilter = `WHERE date >= date_trunc('week', CURRENT_DATE)`;
      prevDateFilter = `WHERE date >= date_trunc('week', CURRENT_DATE - INTERVAL '1 week') AND date < date_trunc('week', CURRENT_DATE)`;
    } else if (period === "month") {
      dateFilter = `WHERE date >= date_trunc('month', CURRENT_DATE)`;
      prevDateFilter = `WHERE date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND date < date_trunc('month', CURRENT_DATE)`;
    } else if (period === "custom") {
      let { startDate, endDate } = req.query;
      if (startDate && endDate) {
        // Quick regex to prevent SQL injection in date strings
        startDate = startDate.replace(/[^0-9\-]/g, "");
        endDate = endDate.replace(/[^0-9\-]/g, "");
        dateFilter = `WHERE date >= '${startDate}'::DATE AND date < '${endDate}'::DATE`;
        prevDateFilter = `WHERE date >= '${startDate}'::DATE AND date < '${startDate}'::DATE`;
      }
    }

    // Correctly map the "date" column for payments/expenses to the "start_time" column for bookings
    const bDateFilter = dateFilter
      .replace(/date >=/g, "start_time >=")
      .replace(/date </g, "start_time <");
    const bPrevDateFilter = prevDateFilter
      .replace(/date >=/g, "start_time >=")
      .replace(/date </g, "start_time <");

    const getStats = async (dFilter, bFilter) => {
      const revenueRes = await db.query(
        `SELECT SUM(amount) as total FROM payments ${dFilter}`,
      );
      const expensesRes = await db.query(
        `SELECT SUM(amount) as total FROM expenses ${dFilter}`,
      );
      const bookingsRes = await db.query(
        `SELECT COUNT(*) as total FROM bookings ${bFilter}`,
      );
      const completedCond = bFilter
        ? bFilter + " AND status = 'Completed'"
        : "WHERE status = 'Completed'";
      const completedRes = await db.query(
        `SELECT COUNT(*) as total FROM bookings ${completedCond}`,
      );

      const rev = parseFloat(revenueRes.rows[0].total) || 0;
      const exp = parseFloat(expensesRes.rows[0].total) || 0;

      return {
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
        bookings: parseInt(bookingsRes.rows[0].total) || 0,
        completed: parseInt(completedRes.rows[0].total) || 0,
      };
    };

    const getTimeline = async (dFilter, trunc) => {
      const revTimeline = await db.query(
        `SELECT date_trunc('${trunc}', date) as time, SUM(amount) as total FROM payments ${dFilter} GROUP BY time ORDER BY time ASC`,
      );
      const expTimeline = await db.query(
        `SELECT date_trunc('${trunc}', date) as time, SUM(amount) as total FROM expenses ${dFilter} GROUP BY time ORDER BY time ASC`,
      );

      const timelineMap = {};

      revTimeline.rows.forEach((r) => {
        const t = new Date(r.time).toISOString();
        if (!timelineMap[t])
          timelineMap[t] = { time: t, revenue: 0, expenses: 0 };
        timelineMap[t].revenue = parseFloat(r.total) || 0;
      });

      expTimeline.rows.forEach((r) => {
        const t = new Date(r.time).toISOString();
        if (!timelineMap[t])
          timelineMap[t] = { time: t, revenue: 0, expenses: 0 };
        timelineMap[t].expenses = parseFloat(r.total) || 0;
      });

      return Object.values(timelineMap).sort(
        (a, b) => new Date(a.time) - new Date(b.time),
      );
    };

    let trunc = "day";
    if (period === "all") trunc = "month";

    const currentStats = await getStats(dateFilter, bDateFilter);
    const timeline = await getTimeline(dateFilter, trunc);
    let previousStats = {
      revenue: 0,
      expenses: 0,
      profit: 0,
      bookings: 0,
      completed: 0,
    };

    if (period !== "all") {
      previousStats = await getStats(prevDateFilter, bPrevDateFilter);
    }

    const calculateChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.json({
      ...currentStats,
      timeline,
      changes: {
        revenue: calculateChange(currentStats.revenue, previousStats.revenue),
        expenses: calculateChange(
          currentStats.expenses,
          previousStats.expenses,
        ),
        profit: calculateChange(currentStats.profit, previousStats.profit),
        bookings: calculateChange(
          currentStats.bookings,
          previousStats.bookings,
        ),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
