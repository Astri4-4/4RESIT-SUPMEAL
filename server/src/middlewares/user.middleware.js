import * as userService from "../services/user.service.js";
import {body, param} from "express-validator";

export const getUserByIdValidator = [
    param('id').isInt().withMessage('L\'identifiant utilisateur doit être un entier')
];

export const updateUserValidator = [
    body("username").optional().isString().withMessage("Le nom d'utilisateur doit être une chaîne de caractères"),
    body("email").optional().isEmail().withMessage("L'adresse e-mail doit être valide"),
    body("password").optional().isString().withMessage("Le mot de passe doit être une chaîne de caractères").notEmpty().withMessage("Le mot de passe ne peut pas être vide"),
    body("image_url").optional().isString().withMessage("L'URL de l'image doit être une chaîne de caractères")
]

export const updatePreferencesValidator = [
    body("tagIds").isArray().withMessage("tagIds doit être un tableau"),
    body("tagIds.*").isInt().withMessage("Chaque tagId doit être un entier"),
]

export const importUserDataValidator = [
    body("recipes").optional().isArray().withMessage("recipes doit être un tableau"),
    body("cookbooks").optional().isArray().withMessage("cookbooks doit être un tableau"),
]

export async function doTokenUserExistsById(req, res, next) {
    const id = req.user.id;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        next();
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
}

export async function doParamUserExistsById(req, res, next) {
    const id = req.params.id;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        next();
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
}

export async function doBodyUserExistsById(req, res, next) {
    const id = req.body.id;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        next();
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
}
