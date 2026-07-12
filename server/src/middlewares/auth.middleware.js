import { body } from 'express-validator';
import pool from "../database/db.js";

export const registerValidation = [
    body('username')
        .isString()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long')
        .notEmpty()
        .withMessage('Username is required'),

    body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .notEmpty()
        .withMessage('Email is required'),

    body('password')
        .isStrongPassword({
            "minLength": 6,
            "minLowercase": 1,
            "minUppercase": 1,
            "minNumbers": 1,
            "minSymbols": 1
        })
        .withMessage('Password must be at least 6 characters long, contain at least one uppercase letter, one lowercase letter, one number and one symbol')
        .notEmpty()
        .withMessage('Password is required'),

    body('rgpd')
        .isBoolean().withMessage('rgpd must be a boolean')
        .custom((value) => value === true || value === 'true')
        .withMessage('rgpd confirmation must be true')
]
export const loginValidation = [
    body('username')
        .isString()
        .withMessage('Invalid username')
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
]

export async function isUsernameUsed(req, res, next) {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [req.body.username]);
    if (user.rows.length > 0) {
        return res.status(400).json({ message: 'Username is already in use' });
    }
    next();
}

export async function isEmailUsed(req, res, next) {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
    if (user.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' });
    }
    next();
}