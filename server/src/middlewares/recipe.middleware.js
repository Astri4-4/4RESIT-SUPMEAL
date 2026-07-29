import {body, param} from "express-validator";
import {getRecipeById, isRecipeInCookbook} from "../services/recipe.service.js";
import * as cookbookService from "../services/cookbook.service.js";

export const createRecipeValidator = [
    body("title")
        .notEmpty()
        .withMessage("Title is required")
        .isString()
        .withMessage("Title must be a valid string")
        .isLength({ max: 100 })
        .withMessage("Title must be less than 100 characters"),

    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a valid string"),

    body("prepTime")
        .notEmpty()
        .withMessage("Prep time is required")
        .isInt({ min: 0 })
        .withMessage("Prep time must be a positive integer"),

    body("cookTime")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Cook time must be a positive integer"),

    body("servings")
        .notEmpty()
        .withMessage("Servings is required")
        .isInt({ min: 1 })
        .withMessage("Servings must be a positive integer"),

    body("ingredients")
        .isArray()
        .withMessage("Ingredients must be an array"),

    body("ingredients.*.name")
        .notEmpty()
        .withMessage("Ingredient name is required")
        .isString()
        .withMessage("Ingredient name must be a valid string"),

    body("ingredients.*.unit")
        .optional()
        .isString()
        .withMessage("Ingredient unit must be a valid string"),

    body("ingredients.*.type")
        .optional()
        .isString()
        .withMessage("Ingredient type must be a valid string"),

    body("ingredients.*.quantity")
        .notEmpty()
        .withMessage("Ingredient quantity is required")
        .isFloat({ min: 0 })
        .withMessage("Ingredient quantity must be a positive number"),

    body("steps")
        .isArray()
        .withMessage("Steps must be an array"),

    body("steps.*.step_number")
        .notEmpty()
        .withMessage("Step number is required")
        .isInt({ min: 1 })
        .withMessage("Step number must be a positive integer"),

    body("steps.*.description")
        .notEmpty()
        .withMessage("Step description is required")
        .isString()
        .withMessage("Step description must be a valid string"),
];

export const uploadRecipeImageValidator = [
    param("recipeId")
        .notEmpty()
        .withMessage("Recipe image is required")
        .isInt({ min: 1 })
        .withMessage("Recipe image must be a valid integer"),
]

export const getRecipeByIdValidator = [
    param("id")
        .notEmpty()
        .withMessage("Recipe id is required")
        .isInt({ min: 1 })
        .withMessage("Recipe id must be a valid integer"),
];

export async function doRecipeExistsParam(req, res, next) {
    const recipeId = req.params.recipeId || req.params.id;

    try {
        const recipe = await getRecipeById(recipeId);
        if (recipe.length === 0) {
            return res.status(404).send({
                message: "Recipe not found",
            })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        })
    }

}

export async function doUserHasWritePermission(req, res, next) {
    const userId = req.user.id;
    const recipeId = req.params.recipeId || req.body.recipeId || null;

    try {
        const isRequestedRecipeInCookbook = await isRecipeInCookbook(recipeId);
        if (isRequestedRecipeInCookbook) {
            const role = await cookbookService.getUserRoleInCookbook(userId);
            if (role === "owner" || role === "editor") {
                next()
            } else {
                return res.status(403).send({
                    message: "You do not have cookbook permission to use this action",
                })
            }
        } else {
            const recipe = await getRecipeById(recipeId);
            console.log(recipe[0].owner);
            console.log(userId);

            if (recipe[0].owner === userId) {
                next()
            } else {
                return res.status(403).send({
                    message: "You do not have permission to use this action",
                })
            }
        }
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        })
    }

}

export async function doUserHasViewPermission(req, res, next) {
    const userId = req.user.id;
    const recipeId = req.params.recipeId || req.body.recipeId || null;

    try {
        const isRequestedRecipeInCookbook = await isRecipeInCookbook(recipeId);
        if (isRequestedRecipeInCookbook) {
            const role = await cookbookService.getUserRoleInCookbook(userId);
            if (role === "owner" || role === "editor" || role === "viewer") {
                next()
            } else {
                return res.status(403).send({
                    message: "You do not have permission to use this action",
                })
            }
        } else {
            const recipe = await getRecipeById(recipeId);
            if (recipe.owner === userId) {
                next()
            } else {
                return res.status(403).send({
                    message: "You do not have permission to use this action",
                })
            }
        }
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        })
    }

}