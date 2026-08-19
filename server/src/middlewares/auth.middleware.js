import { body } from 'express-validator';
import pool from "../database/db.js";

export const registerValidation = [
    body('username')
        .isString()
        .isLength({ min: 3 })
        .withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères')
        .notEmpty()
        .withMessage('Le nom d\'utilisateur est requis'),

    body('email')
        .isEmail()
        .withMessage('Adresse e-mail invalide')
        .notEmpty()
        .withMessage('L\'adresse e-mail est requise'),

    body('password')
        .isStrongPassword({
            "minLength": 6,
            "minLowercase": 1,
            "minUppercase": 1,
            "minNumbers": 1,
            "minSymbols": 1
        })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule, un chiffre et un symbole')
        .notEmpty()
        .withMessage('Le mot de passe est requis'),

    body('rgpd')
        .isBoolean().withMessage('Le champ rgpd doit être un booléen')
        .custom((value) => value === true || value === 'true')
        .withMessage('Tu dois accepter la politique de confidentialité')
]
export const loginValidation = [
    body('username')
        .isString()
        .withMessage('Nom d\'utilisateur invalide')
        .notEmpty()
        .withMessage('Le nom d\'utilisateur est requis'),

    body('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
]

export async function isUsernameUsed(req, res, next) {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [req.body.username]);
    if (user.rows.length > 0) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà utilisé' });
    }
    next();
}

export async function isEmailUsed(req, res, next) {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
    if (user.rows.length > 0) {
        return res.status(400).json({ message: 'Cette adresse e-mail est déjà utilisée' });
    }
    next();
}
