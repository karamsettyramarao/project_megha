const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// =====================================================
// USER REGISTER
// =====================================================

const registerUser = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters"
      });
    }

    const existingUser = await new Promise((resolve, reject) => {

      db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (error, row) => {

          if (error) {
            reject(error);
          } else {
            resolve(row);
          }

        }
      );

    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const result = await new Promise((resolve, reject) => {

      db.run(
        `
        INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)
        `,
        [
          name,
          email,
          hashedPassword
        ],
        function (error) {

          if (error) {
            reject(error);
          } else {
            resolve(this);
          }

        }
      );

    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.lastID
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });

  }
};


// =====================================================
// USER LOGIN
// =====================================================

const loginUser = async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;


    if (!name || !email || !password) {

      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });

    }


    const user = await new Promise((resolve, reject) => {

      db.get(
        `
        SELECT
          id,
          name,
          email,
          password
        FROM users
        WHERE email = ?
        `,
        [email],
        (error, row) => {

          if (error) {
            reject(error);
          } else {
            resolve(row);
          }

        }
      );

    });


    if (!user) {

      return res.status(401).json({
        success: false,
        message: "Invalid name, email or password"
      });

    }


    // Check registered name

    const enteredName =
      name.trim().toLowerCase();

    const registeredName =
      user.name.trim().toLowerCase();


    if (enteredName !== registeredName) {

      return res.status(401).json({
        success: false,
        message: "Name does not match this account"
      });

    }


    // Check password

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message: "Invalid name, email or password"
      });

    }


    // Create JWT

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: "user"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );


    return res.status(200).json({

      success: true,

      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });

  }

};


// =====================================================
// ADMIN LOGIN
// =====================================================

const loginAdmin = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });

    }


    const admin = await new Promise((resolve, reject) => {

      db.get(
        `
        SELECT
          id,
          name,
          email,
          password
        FROM admins
        WHERE email = ?
        `,
        [email],
        (error, row) => {

          if (error) {
            reject(error);
          } else {
            resolve(row);
          }

        }
      );

    });


    if (!admin) {

      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });

    }


    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.password
      );


    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });

    }


    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "admin"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );


    return res.status(200).json({

      success: true,

      message: "Admin login successful",

      token,

      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed",
      error: error.message
    });

  }

};


module.exports = {
  registerUser,
  loginUser,
  loginAdmin
};