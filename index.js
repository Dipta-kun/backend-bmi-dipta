const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// GANTI SESUAI DATABASE KAMU
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // kalau XAMPP biasanya kosong
    database: 'bmi_db'
});

// ✅ CEK KONEKSI DB
db.connect(err => {
    if (err) {
        console.error('DB ERROR:', err);
    } else {
        console.log('✅ Database connected!');
    }
});

// ✅ FUNGSI HITUNG BMI
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

// ✅ POST /api/check
app.post('/api/check', (req, res) => {
    const { name, age, height, weight } = req.body;

    const bmi = hitungBMI(weight, height);
    const status = statusBMI(bmi);
    const suggestions = saran(status);

    const sql = `
    INSERT INTO health_history (name, age, height, weight, bmi, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

    db.query(sql, [name, age, height, weight, bmi, status], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.json({
            bmi,
            status,
            suggestions,
            saved: true
        });
    });
});

// ✅ GET /api/history
app.get('/api/history', (req, res) => {
    db.query("SELECT * FROM health_history ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
    });
});

// ✅ DELETE /api/history/:id
app.delete('/api/history/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM health_history WHERE id=?", [id], err => {
        if (err) return res.status(500).json({ error: err });
        res.json({ deleted: true });
    });
});

app.listen(3000, () => {
    console.log("✅ Backend running on http://localhost:3000");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Backend running on port " + PORT);
});