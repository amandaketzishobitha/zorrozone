const express = require("express");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

/* MIDDLEWARE */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* DATABASE */
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "rootroot",
  database: "zorrozone"
});

db.connect(err => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

/* MAIL */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
  user: process.env.EMAIL,
  pass: process.env.EMAIL_PASS
}
});

/* REGISTER */
app.post("/register", (req, res) => {

  console.log("BODY:", req.body);

  const { name, email, mobile, course } = req.body;

  // ✅ VALIDATION
  if (!name || !email || !mobile || !course) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "INSERT INTO users (name,email,mobile,course) VALUES (?,?,?,?)";

  db.query(sql, [name, email, mobile, course], (err, result) => {

    if (err) {
      console.log("DB ERROR:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already registered" });
      }

      return res.status(500).json({ message: "Database error" });
    }

    console.log("✅ User inserted:", result.insertId);

    /* USER MAIL */
    transporter.sendMail({
      from: "zorrozone0607@gmail.com",
      to: email,
      subject: "ZORROZONE Registration Successful",
      text: `Hello ${name},

You registered for: ${course}

We will contact you shortly.

- ZORROZONE Team`
    });

    /* ADMIN MAIL */
    transporter.sendMail({
      from: "zorrozone0607@gmail.com",
      to: "zorrozone0607@gmail.com",
      subject: "New Registration",
      text: `
New Registration:

Name: ${name}
Email: ${email}
Mobile: ${mobile}
Course: ${course}
`
    });

    res.status(200).json({ message: "Success" });

  });

});

/* SERVER */
app.listen(3000, () => {
  console.log("🚀 http://localhost:3000");
});