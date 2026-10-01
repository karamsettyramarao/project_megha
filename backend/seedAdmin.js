const db = require("./config/database");
const bcrypt = require("bcryptjs");

const adminName = "Quiz Admin";
const adminEmail = "admin@quiz.com";
const adminPassword = "admin123";

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const sql = `
      INSERT INTO admins (name, email, password)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    const result = await db.query(sql, [
      adminName,
      adminEmail,
      hashedPassword
    ]);

    if (result.rows.length === 0) {
      console.log("Admin already exists.");
    } else {
      console.log("Admin created successfully.");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
    }

  } catch (error) {
    console.error("Failed to create admin:", error.message);
  } finally {
    await db.end();
  }
}

createAdmin();