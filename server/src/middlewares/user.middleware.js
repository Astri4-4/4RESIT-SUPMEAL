import * as userService from "../services/user.service.js";
import {body, param} from "express-validator";

export const getUserByIdValidator = [
    param('id').isInt().withMessage('User ID must be an integer')
];

export const updateUserValidator = [
    body("username").optional().isString().withMessage("Username must be a string"),
    body("email").optional().isEmail().withMessage("Email must be a valid email address"),
    body("password").optional().isString().withMessage("Password must be a string"),
    body("image_url").optional().isString().withMessage("Image URL must be a string")
]

export async function doTokenUserExistsById(req, res, next) {
    const id = req.user.id;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function doParamUserExistsById(req, res, next) {
    const id = req.params.id;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}