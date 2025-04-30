const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Register Route
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Check if the user or email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            req.flash('error', 'An error occurred, please try again');
            return res.redirect('/');
        }
        if (results.length > 0) {
            req.flash('error', 'Username or email already exists');
            return res.redirect('/');
        }

        // Proceed with registration
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            (err) => {
                if (err) {
                    req.flash('error', 'An error occurred during registration');
                    return res.redirect('/');
                }
                req.flash('message', 'Registration successful!');
                res.redirect('/');
            });
    });
});

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/');
        }

        const user = results[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/');
        }

        req.session.userId = user.id;  // Set user ID in session
        req.session.username = user.username;
        res.redirect('/feed');  // Redirect to feed after successful login
    });
});

// Middleware to save the intended route before redirecting to login
router.use((req, res, next) => {
    if (!req.session.userId && req.originalUrl !== '/') {
        req.session.redirectTo = req.originalUrl;  // Save the current route
        return res.redirect('/');
    }
    next();
});

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');  // Redirect to login page after logging out
    });
});


module.exports = router;
