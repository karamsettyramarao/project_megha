const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// ============================================================
// USER REGISTER
// ============================================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO users
        (name, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING id, name, email, created_at
      `,
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Register error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// ============================================================
// USER LOGIN
// ============================================================

const loginUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const result = await db.query(
      `
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER($1)
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid name, email or password",
      });
    }

    const user = result.rows[0];

    if (user.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Invalid name, email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid name, email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("User login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// ============================================================
// ADMIN LOGIN
// ============================================================

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await db.query(
      `
      SELECT *
      FROM admins
      WHERE LOWER(email) = LOWER($1)
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const admin = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Admin login failed",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
};