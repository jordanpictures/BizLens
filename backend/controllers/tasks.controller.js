const db = require("../db");

// GET /api/tasks - list tasks
exports.getTasks = async (req, res) => {
  try {
    const isTeamMember = req.user.role === "Team Member";
    let query = `
      SELECT 
        t.id,
        t.booking_id,
        t.title,
        t.notes,
        t.status,
        t.priority,
        t.show_customer_info,
        t.created_at,
        t.updated_at,
        b.customer_name,
        b.customer_phone,
        b.service_type,
        b.package,
        b.quantity,
        b.start_time,
        b.end_time,
        b.due_date,
        b.status as booking_status,
        b.agreed_price as agreed_price,
        b.agreed_price as total_amount,
        creator.username as created_by_username,
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
      JOIN bookings b ON t.booking_id = b.id
      LEFT JOIN users creator ON t.created_by = creator.id
    `;

    const params = [];

    // If Team Member, only show tasks assigned to them
    if (isTeamMember) {
      query += `
        WHERE EXISTS (
          SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = $1
        )
      `;
      params.push(req.user.id);
    }

    query += ` ORDER BY t.created_at DESC`;

    const { rows } = await db.query(query, params);

    // If Team Member and show_customer_info is false, hide customer name and phone
    if (isTeamMember) {
      rows.forEach((row) => {
        if (!row.show_customer_info) {
          row.customer_name = null;
          row.customer_phone = null;
          row.title = `${row.service_type} Task`;
        }
      });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/tasks/:id - single task details
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const isTeamMember = req.user.role === "Team Member";

    const taskRes = await db.query(
      `
      SELECT 
        t.id,
        t.booking_id,
        t.title,
        t.notes,
        t.status,
        t.priority,
        t.show_customer_info,
        t.created_at,
        t.updated_at,
        b.customer_name,
        b.customer_phone,
        b.service_type,
        b.package,
        b.quantity,
        b.start_time,
        b.end_time,
        b.due_date,
        b.status as booking_status,
        b.notes as booking_notes,
        b.agreed_price as agreed_price,
        b.agreed_price as total_amount,
        COALESCE(SUM(p.amount), 0) as paid_amount,
        creator.username as created_by_username,
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
      JOIN bookings b ON t.booking_id = b.id
      LEFT JOIN payments p ON b.id = p.booking_id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = $1
      GROUP BY t.id, b.id, creator.username
      `,
      [id],
    );

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskRes.rows[0];

    // If Team Member, ensure they are assigned to this task
    if (isTeamMember) {
      const isAssigned = (task.assignees || []).some(
        (u) => u.id === req.user.id,
      );
      if (!isAssigned) {
        return res
          .status(403)
          .json({ error: "Access denied: You are not assigned to this task" });
      }

      // If show_customer_info is false, hide customer name and phone
      if (!task.show_customer_info) {
        task.customer_name = null;
        task.customer_phone = null;
        task.title = `${task.service_type} Task`;
      }
    }

    // Fetch comments
    const commentsRes = await db.query(
      `
      SELECT tc.id, tc.comment, tc.created_at, u.username, u.position, u.role
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
      `,
      [id],
    );

    task.comments = commentsRes.rows;

    res.json(task);
  } catch (err) {
    console.error("Error fetching task details:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/tasks/assign - Assign or update task for a booking (Owner only)
exports.assignTask = async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(403).json({ error: "Only owners can assign tasks" });
    }

    const {
      booking_id,
      user_ids = [],
      notes = "",
      title,
      priority = "Normal",
      show_customer_info = false,
    } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: "booking_id is required" });
    }

    // Verify booking exists
    const bookingRes = await db.query("SELECT * FROM bookings WHERE id = $1", [
      booking_id,
    ]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const booking = bookingRes.rows[0];
    const taskTitle =
      title ||
      `${booking.service_type} - ${booking.customer_name || "Walk-in"}`;

    // Check if task exists for this booking
    const existingTask = await db.query(
      "SELECT id FROM tasks WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1",
      [booking_id],
    );

    let taskId;
    if (existingTask.rows.length > 0) {
      taskId = existingTask.rows[0].id;
      await db.query(
        `UPDATE tasks 
         SET notes = $1, title = $2, priority = $3, show_customer_info = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [notes, taskTitle, priority, Boolean(show_customer_info), taskId],
      );
    } else {
      const newTask = await db.query(
        `INSERT INTO tasks (booking_id, title, notes, priority, show_customer_info, status, created_by)
         VALUES ($1, $2, $3, $4, $5, 'Pending', $6)
         RETURNING id`,
        [
          booking_id,
          taskTitle,
          notes,
          priority,
          Boolean(show_customer_info),
          req.user.id,
        ],
      );
      taskId = newTask.rows[0].id;
    }

    // Update assignees
    await db.query("DELETE FROM task_assignees WHERE task_id = $1", [taskId]);

    if (Array.isArray(user_ids) && user_ids.length > 0) {
      for (const uId of user_ids) {
        await db.query(
          "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [taskId, uId],
        );
      }
    }

    // Fetch updated task with assignees
    const updated = await db.query(
      `
      SELECT 
        t.*,
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
      WHERE t.id = $1
      `,
      [taskId],
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("Error assigning task:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/tasks/:id/unassign - Unassign task (Owner only)
exports.unassignTask = async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(403).json({ error: "Only owners can unassign tasks" });
    }

    const { id } = req.params;
    await db.query("DELETE FROM task_assignees WHERE task_id = $1", [id]);
    await db.query(
      "UPDATE tasks SET notes = '', status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id],
    );

    res.json({ message: "Task unassigned successfully" });
  } catch (err) {
    console.error("Error unassigning task:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH /api/tasks/:id/status - Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { rows } = await db.query(
      `UPDATE tasks 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating task status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/tasks/:id/comments - Add comment/activity update
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const newComment = await db.query(
      `INSERT INTO task_comments (task_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id, comment, created_at`,
      [id, req.user.id, comment.trim()],
    );

    const fullComment = {
      ...newComment.rows[0],
      username: req.user.username,
      position: req.user.position,
      role: req.user.role,
    };

    res.status(201).json(fullComment);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/tasks/team-members - List available team members for assignment
exports.getTeamMembers = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, role, position 
       FROM users 
       WHERE is_active = true 
       ORDER BY 
         CASE WHEN role = 'Team Member' THEN 1 WHEN role = 'Receptionist' THEN 2 ELSE 3 END,
         username ASC`,
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching team members:", err);
    res.status(500).json({ error: "Server error" });
  }
};
