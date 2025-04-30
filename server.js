const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const db = require('./db');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'cce178320990f0261dd15e62866ff39f579b2c7d083f18f6762393f2eee0c2c5f7031118c82c33e43f5c2e0f4dce70b9c78c8145e63656d7cdaa24bb849b5faf',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


function checkLogin(req, res, next) {
    console.log('Checking login...');
    if (!req.session.userId) {
        req.session.redirectTo = req.originalUrl;
        return res.redirect('/');
    }
    next();
}


const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

app.use('/', authRoutes);
app.use('/', postRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    res.render('login', {
        message: req.flash('message'),
        error: req.flash('error')
    });
});

app.get('/feed', (req, res) => {
   
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
});


  
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
