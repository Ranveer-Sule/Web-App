const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;  

const db = new sqlite3.Database('./database/users_ratings.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) { return console.error(err.message); }
});

app.use(express.json());
app.use(express.static('public'));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

const sqlusers = `INSERT INTO USERS (username, password) VALUES (?, ?)`;
const sqlratings = `INSERT INTO RATINGS (user_id, movie_id, rating) VALUES (?, ?, ?)`;

function handleSignup(username, password, res) {
    db.get(`SELECT username FROM USERS WHERE username = ?`, [username], (err, row) => {
        if (err) { return res.json({ success: false, message: err.message }); }
        if (row) { return res.json({ success: false, message: 'This Username is taken please choose another' }); }
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) { return res.json({ success: false, message: 'Error hashing password' }); }
            db.run(sqlusers, [username, hashedPassword], function(err) {
                if (err) { return res.json({ success: false, message: err.message }); }
                res.json({ success: true, message: `User ${username} signed up successfully` });
            });
        });
    });
}

function handleLogin(username, password, res) {
    db.get(`SELECT * FROM USERS WHERE username = ?`, [username], (err, row) => {
        if (err) { return res.json({ success: false, message: err.message }); }
        if (!row) { return res.json({ success: false, message: 'Invalid username or password' }); }
        bcrypt.compare(password, row.password, (err, isMatch) => {
            if (err) { return res.json({ success: false, message: 'Error checking password' }); }
            if (isMatch) {
                res.json({ success: true, message: `Logged in as ${username}` });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        });
    });
}

function handleAuth(req, res) {
    const { username, password, buttonPressed } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: 'Missing username or password' });
    }

    if (buttonPressed === 'signup') {
        handleSignup(username, password, res);
    } else if (buttonPressed === 'login') {
        handleLogin(username, password, res);
    }
}

function handleProfileUpdate(req, res) {
    const { currentUsername, newUsername, newPassword } = req.body;

    if (!currentUsername || !newUsername) {
        return res.json({ success: false, message: 'Missing required fields.' });
    }

    db.get(`SELECT username FROM USERS WHERE username = ? AND username != ?`, [newUsername, currentUsername], (err, row) => {
        if (err) { return res.json({ success: false, message: err.message }); }
        if (row) { return res.json({ success: false, message: 'That username is already taken.' }); }

        if (newPassword) {
            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) { return res.json({ success: false, message: 'Error hashing password.' }); }
                db.run(`UPDATE USERS SET username = ?, password = ? WHERE username = ?`, [newUsername, hashedPassword, currentUsername], function(err) {
                    if (err) { return res.json({ success: false, message: err.message }); }
                    res.json({ success: true, message: 'Profile updated successfully.' });
                });
            });
        } else {
            db.run(`UPDATE USERS SET username = ? WHERE username = ?`, [newUsername, currentUsername], function(err) {
                if (err) { return res.json({ success: false, message: err.message }); }
                res.json({ success: true, message: 'Profile updated successfully.' });
            });
        }
    });
}

app.post('/auth', handleAuth);
app.post('/profile/update', handleProfileUpdate);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});