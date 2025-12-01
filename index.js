const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// =============== DATABASE ===============
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10
});

// TEST CONNECTION
db.getConnection((err, conn) => {
    if (err) {
        console.error("❌ DB ERROR:", err);
    } else {
        console.log("✅ Database Connected to Railway!");
        conn.release();
    }
});

// =============== BMI FUNCTIONS ===============
function hitungBMI(bb, tb) {
    const m = tb / 100;
    return +(bb / (m * m)).toFixed(1);
}

function statusBMI(b) {
    if (b < 18.5) return "Kurus";
    if (b < 25) return "Normal";
    if (b < 30) return "Kelebihan berat badan";
    return "Obesitas";
}

function saran(status) {
    if (status == "Obesitas") return ["Jogging 20–30 menit", "Diet rendah gula", "Latihan kalistenik"];
    if (status == "Kurus") return ["Perbanyak makan", "Susu & telur", "Latihan beban ringan"];
    return ["Pola makan sehat", "Olahraga rutin"];
}

// =============== ROUTES ===============
app.post("/api/check", (req, res) => {
    const { name, age, height, weight } = req.body;
    const bmi = hitungBMI(weight, height);
    const sts = statusBMI(bmi);
    const suggestions = saran(sts);

    const sql = `INSERT INTO health_history (name, age, height, weight, bmi, status) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [name, age, height, weight, bmi, sts], (err) => {
        if (err) return res.status(500).json({ error: err });

        res.json({ bmi, status: sts, suggestions, saved: true });
    });
});

app.get("/api/history", (req, res) => {
    db.query("SELECT * FROM health_history ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
    });
});

app.delete("/api/history/:id", (req, res) => {
    db.query("DELETE FROM health_history WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ deleted: true });
    });
});

// =============== PORT ===============
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("🚀 Backend running on port " + PORT));