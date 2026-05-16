const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const app = express();
const PORT = 3000;

const db = new sqlite3.Database('./database/users_ratings.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) console.error(err.message);
});

app.use(express.json());
app.use(express.static('public'));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

// SQL templates
const SQL_INSERT_USER = 'INSERT INTO USERS (username, password) VALUES (?, ?)';
const SQL_INSERT_RATING = 'INSERT INTO RATINGS (user_id, movie_id, rating) VALUES (?, ?, ?)';

// Promisified DB helpers
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) return reject(err);
        return resolve(this);
    });
});

const hash = promisify(bcrypt.hash);
const compare = promisify(bcrypt.compare);

async function handleSignup(username, password, res) {
    try {
        const existing = await dbGet('SELECT username FROM USERS WHERE username = ?', [username]);
        if (existing) return res.json({ success: false, message: 'This Username is taken please choose another' });

        const hashed = await hash(password, 10);
        await dbRun(SQL_INSERT_USER, [username, hashed]);
        return res.json({ success: true, message: `User ${username} signed up successfully` });
    } catch (err) {
        return res.json({ success: false, message: err.message || 'Error hashing password' });
    }
}

async function handleLogin(username, password, res) {
    try {
        const row = await dbGet('SELECT * FROM USERS WHERE username = ?', [username]);
        if (!row) return res.json({ success: false, message: 'Invalid username or password' });

        const isMatch = await compare(password, row.password);
        if (isMatch) return res.json({ success: true, message: `Logged in as ${username}` });
        return res.json({ success: false, message: 'Invalid username or password' });
    } catch (err) {
        return res.json({ success: false, message: 'Error checking password' });
    }
}

function handleAuth(req, res) {
    const { username, password, buttonPressed } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: 'Missing username or password' });
    }

    if (buttonPressed === 'signup') return handleSignup(username, password, res);
    if (buttonPressed === 'login') return handleLogin(username, password, res);
    return res.json({ success: false, message: 'Unknown action' });
}

async function handleProfileUpdate(req, res) {
    try {
        const { currentUsername, newUsername, newPassword } = req.body;
        if (!currentUsername || !newUsername) {
            return res.json({ success: false, message: 'Missing required fields.' });
        }

        const conflict = await dbGet('SELECT username FROM USERS WHERE username = ? AND username != ?', [newUsername, currentUsername]);
        if (conflict) return res.json({ success: false, message: 'That username is already taken.' });

        if (newPassword) {
            const hashed = await hash(newPassword, 10);
            await dbRun('UPDATE USERS SET username = ?, password = ? WHERE username = ?', [newUsername, hashed, currentUsername]);
        } else {
            await dbRun('UPDATE USERS SET username = ? WHERE username = ?', [newUsername, currentUsername]);
        }

        return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
}

async function handleGetRatings(req, res) {
    try {
        const { movie_id } = req.params;
        const rows = await dbAll('SELECT rating FROM RATINGS WHERE movie_id = ?', [movie_id]);
        const count = rows.length;
        const average = count ? rows.reduce((sum, r) => sum + r.rating, 0) / count : 0;
        return res.json({ average, count });
    } catch (err) {
        return res.json({ average: 0, count: 0 });
    }
}

async function handlePostRating(req, res) {
    try {
        const { username, movie_id, rating } = req.body;
        if (!username || !movie_id || rating == null) return res.json({ success: false, message: 'Missing fields.' });
        if (rating < 0 || rating > 5 || (rating * 2) % 1 !== 0) return res.json({ success: false, message: 'Rating must be between 0 and 5.' });

        const user = await dbGet('SELECT id FROM USERS WHERE username = ?', [username]);
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const existing = await dbGet('SELECT id FROM RATINGS WHERE user_id = ? AND movie_id = ?', [user.id, movie_id]);
        if (existing) {
            await dbRun('UPDATE RATINGS SET rating = ? WHERE user_id = ? AND movie_id = ?', [rating, user.id, movie_id]);
        } else {
            await dbRun(SQL_INSERT_RATING, [user.id, movie_id, rating]);
        }

        return res.json({ success: true });
    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
}

app.post('/auth', handleAuth);
app.post('/profile/update', handleProfileUpdate);
app.get('/ratings/:movie_id', handleGetRatings);
app.post('/ratings', handlePostRating);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});