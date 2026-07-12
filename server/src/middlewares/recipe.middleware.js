import { body } from "express-validator";

export const createRecipeValidator = [
    body("title")
        .notEmpty()
        .withMessage("Title is required")
        .isString()
        .withMessage("Title must be a string"),
    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a string"),
    body("prepTime")
        .notEmpty()
        .withMessage("Prep Time is required")
        .isInt({ min: 1 })
        .withMessage("Prep Time must be a positive integer"),
    body("cookTime")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Cook Time must be a positive integer"),
    body("servings")
        .notEmpty()
        .withMessage("Serving is required")
        .isInt({ min: 1 })
        .withMessage("Serving must be a positive integer"),
]

