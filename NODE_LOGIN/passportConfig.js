const LocalStrategy = require("passport-local");
const { pool } = require('./dbConfig');
const bcrypt = require("bcrypt");

function initialize(passport) {
    const authenticateUser = (username, password, done) => {
        pool.query(
            `SELECT * FROM mydb.users WHERE username = $1`, [username], (err, result) => {
                if (err) {
                    throw err;
                }
                console.log(result.rows);

                if (result.rows.length > 0) {
                    // Pass in data from the database into the user variable
                    const user = result.rows[0];


                    console.log('Password:', password);
                    console.log('Stored hash:', user.password);

                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            throw err;
                        }

                        if (isMatch) {
                            // Return user and store it in session cookie
                            return done(null, user);
                        } else {
                            return done(null, false, { message: "Password is not correct" });
                        }
                    });
                } else {
                    return done(null, false, { message: "Username is not registered" });
                }
            }
        );
    };

    passport.use(
        new LocalStrategy(
            {
                usernameField: "username",
                passwordField: "password",
            },
            authenticateUser
        )
    );

    passport.serializeUser((user, done) => done(null, user.username));

    passport.deserializeUser((username, done) => { // Use email to query based on the serialized user
        pool.query(
            'SELECT * FROM mydb.users WHERE username = $1', [username], (err, result) => {
                if (err) {
                    throw err;
                }
                return done(null, result.rows[0]);
            }
        );
    });
}

module.exports = initialize;
