const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;  

const db = new sqlite3.Database('./database/users_ratings.db',sqlite3.OPEN_READWRTIE,(err)=>{
    if(err){ return console.error(err.message);
    }
});

app.use(express.json());
app.use(express.static('public'));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

const sql = `INSERT INTO USERS (username, password) VALUES (?, ?)`;

app.post('/auth', (req, res) => {
    const { username, password, buttonPressed } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Missing username or password' });
    }

    if (buttonPressed === 'signup') {
        // Check if username already exists
        db.get(`SELECT username FROM USERS WHERE username = ?`, [username], (err, row) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }
            if (row) {
                return res.json({ success: false, message: 'This Username is taken please choose another' });
            }
            // Username doesn't exist, proceed with signup
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.json({ success: false, message: 'Error hashing password' });
                }
                db.run(sql, [username, hashedPassword], function(err) {
                    if (err) {
                        return res.json({ success: false, message: err.message });
                    }
                    res.json({ success: true, message: `User ${username} signed up successfully` });
                });
            });
        });
    } else if (buttonPressed === 'login') {
        db.get(`SELECT * FROM USERS WHERE username = ?`, [username], (err, row) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }
            if (row) {
                bcrypt.compare(password, row.password, (err, isMatch) => {
                    if (err) {
                        return res.json({ success: false, message: 'Error checking password' });
                    }
                    if (isMatch) {
                        res.json({ success: true, message: `Logged in as ${username}` });
                    } else {
                        res.json({ success: false, message: 'Invalid username or password' });
                    }
                });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});