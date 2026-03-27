const express = require("express");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

/* MIDDLEWARE */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* DATABASE (PostgreSQL - Railway) */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
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
app.post("/register", async (req, res) => {

  const { name, email, mobile, course } = req.body;

  if (!name || !email || !mobile || !course) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {

    const sql = "INSERT INTO users (name,email,mobile,course) VALUES ($1,$2,$3,$4)";
    await pool.query(sql, [name, email, mobile, course]);

    console.log("✅ User inserted");

    /* USER MAIL */
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "ZORROZONE Registration Successful",
      text: `Hello ${name},

You registered for: ${course}

We will contact you shortly.

- ZORROZONE Team`
    });

    /* ADMIN MAIL */
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: process.env.EMAIL,
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

  } catch (err) {

    console.log("DB ERROR:", err);

    if (err.code === "23505") {
      return res.status(400).json({ message: "Email already registered" });
    }

    res.status(500).json({ message: "Server error" });
  }

});

/* DASHBOARD (REAL DATA) */
app.get("/dashboard/:email", async (req, res) => {

  const email = req.params.email;

  try {

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.send("<h2>User not found</h2>");
    }

    const user = result.rows[0];

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
        <p>Registered successfully 🎉</p>
      </div>

    </div>

    </body>
    </html>
    `;

    res.send(html);

  } catch (err) {
    console.log(err);
    res.send("Error loading dashboard");
  }

});

/* SERVER */
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});