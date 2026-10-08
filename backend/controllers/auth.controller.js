const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (user.is_active === false) {
      return res.status(401).json({ error: "Account has been deactivated" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        position: user.position,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        position: user.position,
        salary: user.salary,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, username, role, position, salary, is_active FROM users WHERE id = $1",
      [req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
