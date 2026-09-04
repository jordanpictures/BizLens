const db = require("../db");

exports.getBookings = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.*, COALESCE(SUM(p.amount), 0) as paid_amount 
      FROM bookings b 
      LEFT JOIN payments p ON b.id = p.booking_id 
      GROUP BY b.id 
      ORDER BY b.start_time ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const bookingRes = await db.query(
      `
      SELECT b.*, COALESCE(SUM(p.amount), 0) as paid_amount 
      FROM bookings b 
      LEFT JOIN payments p ON b.id = p.booking_id 
      WHERE b.id = $1
      GROUP BY b.id
    `,
      [req.params.id],
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const paymentsRes = await db.query(
      `
      SELECT * FROM payments WHERE booking_id = $1 ORDER BY date DESC
    `,
      [req.params.id],
    );

    const booking = bookingRes.rows[0];
    booking.payments = paymentsRes.rows;

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createBooking = async (req, res) => {
  const {
    customer_name,
    customer_phone,
    service_type,
    package: selectedPackage,
    quantity,
    start_time,
    end_time,
    agreed_price,
    notes,
    amount_paid,
  } = req.body;

  try {
    await db.query("BEGIN");

    // Convert array to string if multiple packages were selected
    const packageStr = Array.isArray(selectedPackage)
      ? selectedPackage.join(", ")
      : selectedPackage;

    const result = await db.query(
      `INSERT INTO bookings (customer_name, customer_phone, service_type, package, quantity, start_time, end_time, agreed_price, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        customer_name || null,
        customer_phone || null,
        service_type,
        packageStr,
        quantity,
        start_time,
        end_time || null,
        agreed_price,
        notes,
      ],
    );

    const booking = result.rows[0];

    // Automatically record a payment if an initial amount was paid
    if (amount_paid && parseFloat(amount_paid) > 0) {
      await db.query(
        `INSERT INTO payments (booking_id, amount, payment_method, date, notes) 
         VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
        [booking.id, amount_paid, "Cash", "Initial payment upon booking"],
      );
    }

    await db.query("COMMIT");
    res.status(201).json(booking);
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
