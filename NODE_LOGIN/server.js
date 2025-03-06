const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 4000;

//serve static files (CSS, IMAGES, JS)
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.get('/', (req, res) => {
    res.render('index');
});

app.set('view engine', 'ejs');

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/products', (req, res) => {
    res.render('products');
});

app.get('/profileSettings', (req, res) => {
    res.render('profileSettings');
});

app.get('/about', (req, res) => {
    res.render('about.ejs');
});

app.get('/dashboard', (req, res) => {
    res.render("dashboard", {user: "william"});
});

app.post('/signup', async (req, res) => {
    let {username, email, password, password2} = req.body;

    console.log(username, email, password, password2);

    let errors = [];

    if (!username || !email || !password || !password2) {
        errors.push({message: "please fill in all the fields"});
    }

    if (password.length > 45 || username.length > 45){
        errors.push({message: "The Username or Password can not be longer than 45 characters"});
    }

    if (password.length < 8) {
        errors.push({message: "password must be at least 8 characters long"});
    }

    if (password !== password2) {
        errors.push({message: "passwords do not match"});
    }

    if (!email.includes('@')) {
        errors.push({message: "Please enter a valid email"});
    }

    if (errors.length > 0) {
        res.render('signup', {errors});
    } //if form validation is approved hash the password

    //hashed password
    let hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);


    //check if the user already exists
    pool.query(
        "SELECT * FROM users WHERE email = $1 OR username = $2",
        [email, username],
        (error, results) => {
            if (error) {
                throw error;
            }
        }
    );

  /*  if (results.rows.length > 0) {
        errors.push({message: "Email or Username already exists"});
        res.render('signup', {errors});
    } */

        // add a new user to the database
        pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [username, email, hashedPassword],
            (error, results) => {
                if (error) {
                    throw error;
                }
                console.log('User registered successfully:');
                res.redirect('/login'); // Redirect to login page after successful signup
            }
        );
});



app.listen(PORT, () => {
console.log(`Listening on port ${PORT}`);
});