const express = require('express');
const multer = require('multer');
const db = require('../db');
const router = express.Router();


function checkLogin(req, res, next) {
    if (!req.session.userId) {
        req.session.redirectTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

function linkHashtags(text) {
    return text.replace(/#(\w+)/g, '<a href="/posts/hashtag/$1">#$1</a>');
}

router.post('/create', checkLogin, upload.single('media'), (req, res) => {
    const { caption, tags } = req.body;
    const userId = req.session.userId;
    const mediaPath = req.file ? req.file.filename : null;

    const query = 'INSERT INTO posts (user_id, caption, tags, media) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, caption, tags, mediaPath], (err) => {
        if (err) {
            console.error("Error inserting post: ", err);
            return res.status(500).send('Error creating post');
        }
        res.redirect('/feed');
    });
});

router.get('/feed', checkLogin, (req, res) => {
    const postQuery = `
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        ORDER BY posts.created_at DESC
    `;

    const commentQuery = `
        SELECT comments.*, users.username, comments.post_id AS postId 
        FROM comments 
        JOIN users ON comments.user_id = users.id
    `;

    db.query(postQuery, (err, posts) => {
        if (err) throw err;

        db.query(commentQuery, (err, comments) => {
            if (err) throw err;

            posts.forEach(post => {
                post.comments = comments.filter(comment => comment.postId === post.id);
            });

            res.render('feed', {
                username: req.session.username,
                posts,
                linkHashtags
            });
        });
    });
});

router.post('/like', checkLogin, (req, res) => {
    const userId = req.session.userId;
    const postId = req.body.postId;

    const query = 'INSERT INTO likes (user_id, post_id) VALUES (?, ?)';
    db.query(query, [userId, postId], (err) => {
        if (err) throw err;
        res.redirect('/feed');
    });
});

router.get('/like-count/:id', (req, res) => {
    const postId = req.params.id;
  
    const query = 'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?';
    db.query(query, [postId], (err, result) => {
      if (err) {
        console.error('Error fetching like count:', err);
        return res.status(500).json({ error: 'Error fetching like count' });
      }
  
      const likeCount = result[0].like_count;
      res.json({ postId, likeCount });
    });
  });
  
  router.post('/toggle-like/:postId', (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId;
  
    const checkQuery = 'SELECT * FROM likes WHERE post_id = ? AND user_id = ?';
    db.query(checkQuery, [postId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
  
      if (result.length > 0) {
        db.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId], err2 => {
          if (err2) return res.status(500).json({ error: 'Error removing like' });
          res.json({ liked: false });
        });
      } else {
        db.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId], err2 => {
          if (err2) return res.status(500).json({ error: 'Error adding like' });
          res.json({ liked: true });
        });
      }
    });
  });

router.post('/comment', checkLogin, (req, res) => {
    const userId = req.session.userId;
    const { postId, comment } = req.body;

    const query = 'INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)';
    db.query(query, [userId, postId, comment], (err) => {
        if (err) throw err;


        const commentQuery = `
            SELECT comments.comment, users.username 
            FROM comments 
            JOIN users ON comments.user_id = users.id 
            WHERE comments.post_id = ? ORDER BY comments.created_at DESC
        `;
        db.query(commentQuery, [postId], (err, comments) => {
            if (err) throw err;
            res.redirect('/feed');
        });
    });
});

router.get('/posts/hashtag/:tag', checkLogin, (req, res) => {
    const tag = req.params.tag;

    const postQuery = `
    SELECT posts.*, users.username 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    WHERE posts.tags LIKE ? 
    ORDER BY posts.created_at DESC
`;

    const commentQuery = `
        SELECT comments.*, users.username 
        FROM comments 
        JOIN users ON comments.user_id = users.id
    `;

    db.query(postQuery, [`%#${tag}%`], (err, posts) => {
        if (err) throw err;

        db.query(commentQuery, (err, comments) => {
            if (err) throw err;

            posts.forEach(post => {
                post.comments = comments.filter(c => c.post_id === post.id);
            });

            res.render('hashtag', { 
                tag, 
                posts, 
                username: req.session.username,
                linkHashtags 
            });
        });
    });
});

router.get('/myposts', checkLogin, (req, res) => {
    const userId = req.session.userId;

    const postQuery = `
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        WHERE posts.user_id = ? 
        ORDER BY posts.created_at DESC
    `;

    const commentQuery = `
        SELECT comments.*, users.username, comments.post_id AS postId 
        FROM comments 
        JOIN users ON comments.user_id = users.id
    `;

    db.query(postQuery, [userId], (err, posts) => {
        if (err) throw err;

        db.query(commentQuery, (err, comments) => {
            if (err) throw err;

            posts.forEach(post => {
                post.comments = comments.filter(c => c.postId === post.id);
            });

            res.render('myposts', {
                username: req.session.username,
                posts,
                linkHashtags
            });
        });
    });
});

router.post('/delete-post/:id', (req, res) => {
    const postId = req.params.id;
  
    db.query('DELETE FROM likes WHERE post_id = ?', [postId], (err, result) => {
        if (err) {
          console.error('Error deleting likes:', err);
          return res.status(500).send('Error deleting likes');
        }

        db.query('DELETE FROM comments WHERE post_id = ?', [postId], (err, result) => {
          if (err) {
            console.error('Error deleting comments:', err);
            return res.status(500).send('Error deleting comments');
          }

          db.query('DELETE FROM posts WHERE id = ?', [postId], (err, result) => {
            if (err) {
              console.error('Error deleting post:', err);
              return res.status(500).send('Error deleting post');
            }
            res.redirect('/myposts');
          });
        });
      });
    });

module.exports = router;
