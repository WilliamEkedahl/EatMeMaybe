const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session"); //cookies to see if you are logged in
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require("./passportConfig");

initializePassport(passport);

const PORT = process.env.PORT || 4000;

//middle ware
app.use(passport.initialize());


//serve static files (CSS, IMAGES, JS)
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.use(session({
    secret: process.env.SESSION_SECRET,

    resave: false,

    //save session details if no value has changed
    saveUninitialized: false,
}));

app.use(flash());

app.set('view engine', 'ejs');

// Middleware to check if the user is logged in
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // User is authenticated, proceed to the next middleware
    } else {
        return res.redirect('/login'); // If not, redirect to the login page
    }
}

// Middleware to check if the user is already logged in
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/index'); // If logged in, redirect to the index page
    }
    return next();
}

app.get('/', checkAuthenticated,  (req, res) => {
    res.render('index');
});



app.get('/signup', (req, res) => {
    res.render("signup");
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login");
});

app.get('/products', checkAuthenticated, (req, res) => {
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

    if (password.length > 45 || username.length > 45) {
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

    try {
        // Check if user already exists
        const userExists = await pool.query(
            "SELECT * FROM mydb.users WHERE email = $1 OR username = $2",
            [email, username]
        );

        if (userExists.rows.length > 0) {
            errors.push({ message: "Email or Username already exists" });
            return res.render('signup', { errors });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Hashed password:", hashedPassword);

        // Insert new user into the database
        await pool.query(
            "INSERT INTO mydb.users (username, email, password) VALUES ($1, $2, $3)",
            [username, email, hashedPassword]
        );

        console.log('User registered successfully');
        req.flash('success_msg', 'Successfully registered! You can log in now');
        res.redirect("/login"); // Redirect to login page after successful signup

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Server error");
    }
});

app.post("/login",
    passport.authenticate("local", {
        successRedirect: "/index",
        failureRedirect: "/login",
        failureFlash: true
    })
);


app.listen(PORT, () => {
console.log(`Listening on port ${PORT}`);
});

//OLD CODE
/*     //check if the user already exists

 if (errors.length > 0) {
        res.render('signup', {errors});
    } //if form validation is approved hash the password

    //hashed password
    let hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);


    pool.query(
        "SELECT * FROM mydb.users WHERE email = $1 OR username = $2",
        [email, username],
        (error, results) => {
            if (error) {
                throw error;
            }
            if (results.rows.length > 0) {
                errors.push({message: "Email or Username already exists"});
                res.render('signup', {errors});
            } else {
                pool.query(

                )
            }
        }
    );


    // add a new user to the database
    pool.query(
        "INSERT INTO mydb.users (username, email, password) VALUES ($1, $2, $3)",
        [username, email, hashedPassword],
        (error, results) => {
            if (error) {
                throw error;
            }
            console.log('User registered successfully:');
            req.flash('success_msg', 'Successfully registered!. You can log in now');
            res.redirect("/login"); // Redirect to login page after successful signup
        }
    );
}); */