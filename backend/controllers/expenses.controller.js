const db = require("../db");

exports.getExpenses = async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM expenses ORDER BY date DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createExpense = async (req, res) => {
  const { amount, reason, date } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO expenses (amount, reason, date) 
       VALUES ($1, $2, $3) RETURNING *`,
      [amount, reason, date],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
