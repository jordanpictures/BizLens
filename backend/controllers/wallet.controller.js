const db = require("../db");

// Initialize table if it doesn't exist
const initWalletTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        direction VARCHAR(10) NOT NULL DEFAULT 'CREDIT',
        status VARCHAR(50) NOT NULL DEFAULT 'Approved',
        payment_method VARCHAR(50),
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_task ON wallet_transactions(task_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
    `);
  } catch (err) {
    console.error("Failed to initialize wallet table:", err);
  }
};

initWalletTable();

// Helper to compute user balance
const getUserBalanceSummary = async (userId) => {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'CREDIT' AND status = 'Approved' THEN amount ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN direction = 'DEBIT' AND status = 'Approved' THEN amount ELSE 0 END), 0) as total_withdrawn,
      COALESCE(SUM(CASE WHEN direction = 'DEBIT' AND status = 'Pending' THEN amount ELSE 0 END), 0) as pending_withdrawals
    FROM wallet_transactions
    WHERE user_id = $1
  `;
  const { rows } = await db.query(query, [userId]);
  const row = rows[0] || {};
  const totalEarned = parseFloat(row.total_earned) || 0;
  const totalWithdrawn = parseFloat(row.total_withdrawn) || 0;
  const pendingWithdrawals = parseFloat(row.pending_withdrawals) || 0;
  const availableBalance = Math.max(
    0,
    totalEarned - totalWithdrawn - pendingWithdrawals,
  );

  return {
    total_earned: totalEarned,
    total_withdrawn: totalWithdrawn,
    pending_withdrawals: pendingWithdrawals,
    available_balance: availableBalance,
  };
};

// GET /api/wallet/my-wallet - Personal wallet dashboard
exports.getMyWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await getUserBalanceSummary(userId);

    // Fetch personal transaction history
    const transactionsQuery = `
      SELECT 
        wt.*,
        t.title as task_title,
        b.service_type,
        b.customer_name,
        creator.username as created_by_username,
        reviewer.username as reviewed_by_username
      FROM wallet_transactions wt
      LEFT JOIN tasks t ON wt.task_id = t.id
      LEFT JOIN bookings b ON wt.booking_id = b.id OR t.booking_id = b.id
      LEFT JOIN users creator ON wt.created_by = creator.id
      LEFT JOIN users reviewer ON wt.reviewed_by = reviewer.id
      WHERE wt.user_id = $1
      ORDER BY wt.created_at DESC
      LIMIT 100
    `;
    const { rows: transactions } = await db.query(transactionsQuery, [userId]);

    // Fetch personal withdrawal requests
    const withdrawalRequestsQuery = `
      SELECT 
        wt.*,
        reviewer.username as reviewed_by_username
      FROM wallet_transactions wt
      LEFT JOIN users reviewer ON wt.reviewed_by = reviewer.id
      WHERE wt.user_id = $1 AND wt.type = 'Withdrawal'
      ORDER BY wt.created_at DESC
    `;
    const { rows: withdrawalRequests } = await db.query(
      withdrawalRequestsQuery,
      [userId],
    );

    res.json({
      balance,
      transactions,
      withdrawal_requests: withdrawalRequests,
    });
  } catch (err) {
    console.error("Error fetching user wallet:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/wallet/withdraw - Request a payout/withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payment_method, notes } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: "Please enter a valid withdrawal amount greater than 0",
      });
    }

    // Check available balance
    const balance = await getUserBalanceSummary(userId);
    if (parsedAmount > balance.available_balance) {
      return res.status(400).json({
        error: `Insufficient available balance. You currently have ETB ${balance.available_balance.toFixed(2)} available.`,
      });
    }

    const { rows } = await db.query(
      `INSERT INTO wallet_transactions 
        (user_id, type, amount, direction, status, payment_method, notes, created_by)
       VALUES ($1, 'Withdrawal', $2, 'DEBIT', 'Pending', $3, $4, $5)
       RETURNING *`,
      [
        userId,
        parsedAmount,
        payment_method || "Cash",
        notes ? notes.trim() : null,
        userId,
      ],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error requesting withdrawal:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/wallet/overview - Owner dashboard metrics & pending requests
exports.getWalletOverview = async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(403).json({ error: "Access denied. Owners only." });
    }

    // Company summary stats
    const summaryQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN direction = 'DEBIT' AND status = 'Approved' THEN amount ELSE 0 END), 0) as total_paid_out,
        COALESCE(SUM(CASE WHEN direction = 'DEBIT' AND status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending_amount,
        COALESCE(COUNT(CASE WHEN direction = 'DEBIT' AND status = 'Pending' THEN 1 END), 0) as pending_requests_count,
        COALESCE(SUM(CASE WHEN direction = 'CREDIT' AND status = 'Approved' THEN amount ELSE 0 END), 0) as total_rewards_awarded
      FROM wallet_transactions
    `;
    const { rows: summaryRows } = await db.query(summaryQuery);
    const summary = summaryRows[0];

    // Pending requests with user info
    const pendingQuery = `
      SELECT 
        wt.*,
        u.username,
        u.position,
        u.role
      FROM wallet_transactions wt
      JOIN users u ON wt.user_id = u.id
      WHERE wt.type = 'Withdrawal' AND wt.status = 'Pending'
      ORDER BY wt.created_at ASC
    `;
    const { rows: pendingRequests } = await db.query(pendingQuery);

    // Team wallets summary for all active team members/users
    const teamWalletsQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        u.position,
        u.role,
        COALESCE(SUM(CASE WHEN wt.direction = 'CREDIT' AND wt.status = 'Approved' THEN wt.amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN wt.direction = 'DEBIT' AND wt.status = 'Approved' THEN wt.amount ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(CASE WHEN wt.direction = 'DEBIT' AND wt.status = 'Pending' THEN wt.amount ELSE 0 END), 0) as pending_withdrawals
      FROM users u
      LEFT JOIN wallet_transactions wt ON u.id = wt.user_id
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.position, u.role
      ORDER BY 
        CASE WHEN u.role = 'Team Member' THEN 1 WHEN u.role = 'Receptionist' THEN 2 ELSE 3 END,
        u.username ASC
    `;
    const { rows: teamRows } = await db.query(teamWalletsQuery);

    const teamWallets = teamRows.map((r) => {
      const totalEarned = parseFloat(r.total_earned) || 0;
      const totalWithdrawn = parseFloat(r.total_withdrawn) || 0;
      const pendingWithdrawals = parseFloat(r.pending_withdrawals) || 0;
      return {
        ...r,
        total_earned: totalEarned,
        total_withdrawn: totalWithdrawn,
        pending_withdrawals: pendingWithdrawals,
        available_balance: Math.max(
          0,
          totalEarned - totalWithdrawn - pendingWithdrawals,
        ),
      };
    });

    res.json({
      summary: {
        total_paid_out: parseFloat(summary.total_paid_out) || 0,
        total_pending_amount: parseFloat(summary.total_pending_amount) || 0,
        pending_requests_count: parseInt(summary.pending_requests_count) || 0,
        total_rewards_awarded: parseFloat(summary.total_rewards_awarded) || 0,
      },
      pending_requests: pendingRequests,
      team_wallets: teamWallets,
    });
  } catch (err) {
    console.error("Error fetching wallet overview:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/wallet/transactions - List all transactions (Owner can view all; others view own)
exports.getTransactions = async (req, res) => {
  try {
    const isOwner = req.user.role === "Owner";
    const { user_id, type, status, task_id } = req.query;

    let query = `
      SELECT 
        wt.*,
        u.username as member_username,
        u.position as member_position,
        u.role as member_role,
        t.title as task_title,
        b.service_type,
        b.customer_name,
        creator.username as created_by_username,
        reviewer.username as reviewed_by_username
      FROM wallet_transactions wt
      JOIN users u ON wt.user_id = u.id
      LEFT JOIN tasks t ON wt.task_id = t.id
      LEFT JOIN bookings b ON wt.booking_id = b.id OR t.booking_id = b.id
      LEFT JOIN users creator ON wt.created_by = creator.id
      LEFT JOIN users reviewer ON wt.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    const params = [];

    // Access control
    if (!isOwner) {
      params.push(req.user.id);
      query += ` AND wt.user_id = $${params.length}`;
    } else if (user_id) {
      params.push(user_id);
      query += ` AND wt.user_id = $${params.length}`;
    }

    if (type && type !== "all") {
      params.push(type);
      query += ` AND wt.type = $${params.length}`;
    }

    if (status && status !== "all") {
      params.push(status);
      query += ` AND wt.status = $${params.length}`;
    }

    if (task_id) {
      params.push(task_id);
      query += ` AND wt.task_id = $${params.length}`;
    }

    query += ` ORDER BY wt.created_at DESC LIMIT 1000`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/wallet/reward - Owner awards a reward per task or general
exports.rewardMember = async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(403).json({ error: "Access denied. Owners only." });
    }

    const { user_id, task_id, amount, reward_amount, notes } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Team member is required" });
    }

    const rewardValue = parseFloat(amount || reward_amount) || 0;

    if (rewardValue <= 0) {
      return res
        .status(400)
        .json({ error: "Please enter a valid reward amount greater than 0" });
    }

    let bookingId = null;
    let taskTitle = "";
    if (task_id) {
      const taskRes = await db.query(
        "SELECT booking_id, title FROM tasks WHERE id = $1",
        [task_id],
      );
      if (taskRes.rows.length > 0) {
        bookingId = taskRes.rows[0].booking_id;
        taskTitle = taskRes.rows[0].title;
      }
    }

    const { rows } = await db.query(
      `INSERT INTO wallet_transactions
        (user_id, task_id, booking_id, type, amount, direction, status, notes, created_by)
       VALUES ($1, $2, $3, 'Reward', $4, 'CREDIT', 'Approved', $5, $6)
       RETURNING *`,
      [
        user_id,
        task_id || null,
        bookingId,
        rewardValue,
        notes ? notes.trim() : "Task completion reward",
        req.user.id,
      ],
    );

    // Add activity comment to task if associated
    if (task_id) {
      try {
        const memberRes = await db.query(
          "SELECT username FROM users WHERE id = $1",
          [user_id],
        );
        const memberName = memberRes.rows[0]?.username || "Team Member";

        await db.query(
          `INSERT INTO task_comments (task_id, user_id, comment)
           VALUES ($1, $2, $3)`,
          [
            task_id,
            req.user.id,
            `Owner awarded ETB ${rewardValue} reward to ${memberName}${notes ? ` (${notes})` : ""}`,
          ],
        );
      } catch (commentErr) {
        console.warn("Could not log comment on task for reward:", commentErr);
      }
    }

    res.status(201).json({ success: true, created: rows[0] });
  } catch (err) {
    console.error("Error rewarding team member:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/wallet/requests/:id/approve - Owner approves payout request
exports.approveWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(403).json({ error: "Access denied. Owners only." });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const existingRes = await db.query(
      "SELECT * FROM wallet_transactions WHERE id = $1 AND type = 'Withdrawal' AND status = 'Pending'",
      [id],
    );

    if (existingRes.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Pending withdrawal request not found" });
    }

    const existing = existingRes.rows[0];
    const updatedNotes = notes
      ? `${existing.notes || ""}${existing.notes ? " | " : ""}Approved: ${notes.trim()}`
      : existing.notes;

    const { rows } = await db.query(
      `UPDATE wallet_transactions 
       SET status = 'Approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [req.user.id, updatedNotes, id],
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error approving withdrawal:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/wallet/requests/:id/reject - Owner rejects payout request
exports.rejectWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(403).json({ error: "Access denied. Owners only." });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const existingRes = await db.query(
      "SELECT * FROM wallet_transactions WHERE id = $1 AND type = 'Withdrawal' AND status = 'Pending'",
      [id],
    );

    if (existingRes.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Pending withdrawal request not found" });
    }

    const existing = existingRes.rows[0];
    const rejectionNote =
      reason && reason.trim() ? reason.trim() : "Request declined by owner";
    const updatedNotes = `${existing.notes || ""}${existing.notes ? " | " : ""}Rejected: ${rejectionNote}`;

    const { rows } = await db.query(
      `UPDATE wallet_transactions 
       SET status = 'Rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [req.user.id, updatedNotes, id],
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error rejecting withdrawal:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/wallet/tasks/:task_id/rewards - List rewards for a task
exports.getTaskRewards = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { rows } = await db.query(
      `SELECT 
        wt.*,
        u.username as member_username,
        u.position as member_position,
        creator.username as created_by_username
       FROM wallet_transactions wt
       JOIN users u ON wt.user_id = u.id
       LEFT JOIN users creator ON wt.created_by = creator.id
       WHERE wt.task_id = $1 AND wt.direction = 'CREDIT'
       ORDER BY wt.created_at ASC`,
      [task_id],
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching task rewards:", err);
    res.status(500).json({ error: "Server error" });
  }
};
