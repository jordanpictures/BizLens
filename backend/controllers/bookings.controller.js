const db = require("../db");

exports.getBookings = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.*, 
        COALESCE(SUM(p.amount), 0) as paid_amount,
        t.id as task_id,
        t.status as task_status,
        t.notes as task_notes,
        t.show_customer_info as task_show_customer_info,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'position', u.position, 'role', u.role))
            FROM task_assignees ta
            JOIN users u ON ta.user_id = u.id
            WHERE ta.task_id = t.id
          ),
          '[]'::json
        ) as assignees
      FROM bookings b 
      LEFT JOIN payments p ON b.id = p.booking_id 
      LEFT JOIN (
        SELECT DISTINCT ON (booking_id) id, booking_id, status, notes, show_customer_info, created_at 
        FROM tasks 
        ORDER BY booking_id, created_at DESC
      ) t ON t.booking_id = b.id
      GROUP BY b.id, t.id, t.status, t.notes, t.show_customer_info
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

    const taskRes = await db.query(
      `SELECT t.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'position', u.position, 'role', u.role))
            FROM task_assignees ta
            JOIN users u ON ta.user_id = u.id
            WHERE ta.task_id = t.id
          ),
          '[]'::json
        ) as assignees
       FROM tasks t
       WHERE t.booking_id = $1
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [req.params.id],
    );

    const booking = bookingRes.rows[0];
    booking.payments = paymentsRes.rows;
    booking.task = taskRes.rows[0] || null;

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
    due_date,
    agreed_price,
    notes,
    amount_paid,
    payment_method,
  } = req.body;

  try {
    await db.query("BEGIN");

    // Convert array to string if multiple packages were selected
    const packageStr = Array.isArray(selectedPackage)
      ? selectedPackage.join(", ")
      : selectedPackage;

    const result = await db.query(
      `INSERT INTO bookings (customer_name, customer_phone, service_type, package, quantity, start_time, end_time, due_date, agreed_price, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        customer_name || null,
        customer_phone || null,
        service_type,
        packageStr,
        quantity,
        start_time,
        end_time || null,
        due_date || null,
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
        [
          booking.id,
          amount_paid,
          payment_method || "Cash",
          "Initial payment upon booking",
        ],
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

exports.updateBooking = async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    customer_phone,
    service_type,
    package: selectedPackage,
    quantity,
    start_time,
    end_time,
    due_date,
    agreed_price,
    notes,
  } = req.body;

  try {
    const packageStr = Array.isArray(selectedPackage)
      ? selectedPackage.join(", ")
      : selectedPackage;

    const result = await db.query(
      `UPDATE bookings 
       SET service_type = COALESCE($1, service_type),
           package = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE package END,
           quantity = COALESCE($3, quantity),
           start_time = COALESCE($4, start_time),
           end_time = CASE WHEN $5::boolean THEN $6::timestamp ELSE end_time END,
           due_date = CASE WHEN $7::boolean THEN $8::date ELSE due_date END,
           notes = CASE WHEN $9::boolean THEN $10::text ELSE notes END,
           customer_name = COALESCE($11, customer_name),
           customer_phone = COALESCE($12, customer_phone),
           agreed_price = COALESCE($13, agreed_price)
       WHERE id = $14
       RETURNING *`,
      [
        service_type || null,
        packageStr !== undefined ? packageStr : null,
        quantity || null,
        start_time || null,
        end_time !== undefined,
        end_time || null,
        due_date !== undefined,
        due_date || null,
        notes !== undefined,
        notes || null,
        customer_name || null,
        customer_phone || null,
        agreed_price || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const updatedRes = await db.query(
      `SELECT b.*, COALESCE(SUM(p.amount), 0) as paid_amount 
       FROM bookings b 
       LEFT JOIN payments p ON b.id = p.booking_id 
       WHERE b.id = $1
       GROUP BY b.id`,
      [id],
    );

    const paymentsRes = await db.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY date DESC`,
      [id],
    );

    const updatedBooking = updatedRes.rows[0];
    updatedBooking.payments = paymentsRes.rows;

    res.json(updatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
