const db = require("../db");
const bcrypt = require("bcryptjs");

// === Services ===
exports.getServices = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM services ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name } = req.body;
    const { rows } = await db.query(
      "INSERT INTO services (name) VALUES ($1) RETURNING *",
      [name],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await db.query("DELETE FROM services WHERE id = $1", [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// === Packages ===
exports.getPackages = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM packages ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const { name } = req.body;
    const { rows } = await db.query(
      "INSERT INTO packages (name) VALUES ($1) RETURNING *",
      [name],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    await db.query("DELETE FROM packages WHERE id = $1", [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// === Users ===
exports.getUsers = async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, username, role, is_active FROM users ORDER BY username ASC",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [username, hash, role || "Receptionist"],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, password } = req.body;

    let query, params;

    if (password && password.trim() !== "") {
      const hash = await bcrypt.hash(password, 10);
      query =
        "UPDATE users SET username = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, username, role";
      params = [username, role, hash, id];
    } else {
      query =
        "UPDATE users SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role";
      params = [username, role, id];
    }

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "Cannot deactivate yourself" });
    }
    const { is_active } = req.body;
    const { rows } = await db.query(
      "UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, role, is_active",
      [is_active, req.params.id],
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
