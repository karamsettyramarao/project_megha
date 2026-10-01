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
      VALUES (?, ?, ?)
    `;

    db.run(
      sql,
      [adminName, adminEmail, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            console.log("Admin already exists.");
          } else {
            console.error("Failed to create admin:", err.message);
          }
        } else {
          console.log("Admin created successfully.");
          console.log("Email:", adminEmail);
          console.log("Password:", adminPassword);
        }

        db.close();
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    db.close();
  }
}

createAdmin();