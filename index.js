const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// 🔧 CONNECT DATABASE (PAKAI ENV DARI RAILWAY)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// CEK KONEKSI
db.getConnection((err, conn) => {
    if (err) {
        console.error("❌ Koneksi DB gagal:", err);
    } else {
        console.log("✅ Database connected!");
        conn.release();
    }
});

// =======================
//  LOGIC BMI
// =======================
function hitungBMI(bb, tb) {
    const tinggiM = tb / 100;
    return +(bb / (tinggiM * tinggiM)).toFixed(1);
}

function statusBMI(bmi) {
    if (bmi < 18.5) return "Kurus";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Kelebihan berat badan";
    return "Obesitas";
}

function saran(status) {
    if (status === "Obesitas") {
        return [
            "Jogging 20–30 menit",
            "Diet rendah gula",
            "Latihan kalistenik ringan"
        ];
    }
    if (status === "Kurus") {
        return [
            "Perbanyak nasi & protein",
            "Konsumsi susu & telur",
            "Latihan beban ringan"
        ];
    }
    return [
        "Pertahankan pola makan sehat",
        "Olahraga rutin 3x seminggu"
    ];
}

// =======================
//  API ENDPOINTS
// =======================

// CREATE DATA
app.post('/api/check', (req, res) => {
    const { name, age, height, weight } = req.body;

    const bmi = hitungBMI(weight, height);
    const status = statusBMI(bmi);
    const suggestions = saran(status);

    const sql = `
        INSERT INTO health_history (name, age, height, weight, bmi, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, age, height, weight, bmi, status], (err) => {
        if (err) return res.status(500).json({ error: err });

        res.json({ bmi, status, suggestions, saved: true });
    });
});

// READ DATA
app.get('/api/history', (req, res) => {
    db.query("SELECT * FROM health_history ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
    });
});

// DELETE DATA
app.delete('/api/history/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM health_history WHERE id=?", [id], err => {
        if (err) return res.status(500).json({ error: err });
        res.json({ deleted: true });
    });
});

// =======================
//  START SERVER (Railway Friendly)
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});