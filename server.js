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

/* DASHBOARD PAGE */
app.get("/dashboard", (req, res) => {

  const user = {
    name: "User",
    email: "example@email.com",
    mobile: "0000000000",
    course: "Demo Course"
  };

  const activityHTML = "<p>No activity yet</p>";
  const adminLink = "";

  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard | ZORROZONE</title>

  <link rel="stylesheet" href="/css/style.css">

  <style>
  .dashboard{
    max-width:900px;
    margin:100px auto;
    padding:20px;
    text-align:center;
  }

  .user-card{
    background:white;
    padding:30px;
    border-radius:15px;
    box-shadow:0 10px 30px rgba(0,0,0,0.1);
  }

  .activity{
    margin-top:30px;
    text-align:left;
  }

  .activity p{
    background:#f8fafc;
    padding:10px;
    border-radius:8px;
    margin:8px 0;
  }
  </style>

  </head>

  <body>

  <header>
    <div class="logo-container">
      <img src="/images/logo.png">
      <h1>ZORROZONE</h1>
    </div>
  </header>

  <div class="dashboard">

    <div class="user-card">
      <h2>Welcome ${user.name} 👋</h2>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>Mobile:</b> ${user.mobile}</p>
      <p><b>Course:</b> ${user.course}</p>
    </div>

    <div class="activity">
      <h3>Recent Activity</h3>
      ${activityHTML}
    </div>

  </div>

  </body>
  </html>
  `;

  res.send(html);

});

/* SERVER */
app.listen(3000, () => {
  console.log("🚀 http://localhost:3000");
});