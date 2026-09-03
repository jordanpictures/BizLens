const db = require("../db");

exports.getPayments = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, b.customer_name as name, b.service_type || ' · ' || b.package as booking 
      FROM payments p 
      JOIN bookings b ON p.booking_id = b.id 
      ORDER BY p.date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createPayment = async (req, res) => {
  const { booking_id, amount, payment_method, date, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO payments (booking_id, amount, payment_method, date, notes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking_id, amount, payment_method, date, notes],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
