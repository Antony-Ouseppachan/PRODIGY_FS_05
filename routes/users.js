const express = require('express');
const db = require('../db');
const router = express.Router();

// Profile Page
router.get('/profile/:id', (req, res) => {
    const userId = req.params.id;

    const userQuery = 'SELECT username FROM users WHERE id = ?';
    const postQuery = 'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC';

    db.query(userQuery, [userId], (err, userResults) => {
        if (err || userResults.length === 0) return res.status(404).send('User not found');
        
        const username = userResults[0].username;

        db.query(postQuery, [userId], (err, posts) => {
            if (err) return res.status(500).send('Server error');
            res.render('profile', { username, posts });
        });
    });
});

module.exports = router;
