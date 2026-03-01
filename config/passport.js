/**
 * Passport Configuration (config/passport.js)
 * Sets up Passport.js strategies for local authentication.
 */

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// Function to get a user by username (or ID, depending on how we serialize/deserialize)
const getUserByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM Users WHERE username = ?', [username], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
            try {
                const user = await getUserByUsername(username);

                if (!user) {
                    return done(null, false, { message: 'That username is not registered' });
                }

                // Compare password using bcrypt
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    // Serialization and Deserialization
    passport.serializeUser((user, done) => {
        // Store the user ID in the session
        done(null, user.user_id);
    });

    passport.deserializeUser((id, done) => {
        db.get('SELECT * FROM Users WHERE user_id = ?', [id], (err, user) => {
            if (err) {
                return done(err, null);
            }
            // Remove sensitive data before passing user object along
            if (user) {
                delete user.password; 
            }
            done(null, user);
        });
    });
};