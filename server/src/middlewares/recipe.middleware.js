import {body, param, query} from "express-validator";
import {getRecipeById, isRecipeInCookbook, getCookbookIdForRecipe} from "../services/recipe.service.js";
import * as cookbookService from "../services/cookbook.service.js";

export const createRecipeValidator = [
    body("title")
        .notEmpty()
        .withMessage("Le titre est requis")
        .isString()
        .withMessage("Le titre doit être une chaîne de caractères valide")
        .isLength({ max: 100 })
        .withMessage("Le titre doit contenir moins de 100 caractères"),

    body("description")
        .optional()
        .isString()
        .withMessage("La description doit être une chaîne de caractères valide"),

    body("prepTime")
        .notEmpty()
        .withMessage("Le temps de préparation est requis")
        .isInt({ min: 0 })
        .withMessage("Le temps de préparation doit être un entier positif"),

    body("cookTime")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Le temps de cuisson doit être un entier positif"),

    body("servings")
        .notEmpty()
        .withMessage("Le nombre de portions est requis")
        .isInt({ min: 1 })
        .withMessage("Le nombre de portions doit être un entier positif"),

    body("ingredients")
        .isArray()
        .withMessage("Les ingrédients doivent être un tableau"),

    body("ingredients.*.name")
        .notEmpty()
        .withMessage("Le nom de l'ingrédient est requis")
        .isString()
        .withMessage("Le nom de l'ingrédient doit être une chaîne de caractères valide"),

    body("ingredients.*.unit")
        .optional()
        .isString()
        .withMessage("L'unité de l'ingrédient doit être une chaîne de caractères valide"),

    body("ingredients.*.type")
        .optional()
        .isString()
        .withMessage("Le type de l'ingrédient doit être une chaîne de caractères valide"),

    body("ingredients.*.quantity")
        .notEmpty()
        .withMessage("La quantité de l'ingrédient est requise")
        .isFloat({ min: 0 })
        .withMessage("La quantité de l'ingrédient doit être un nombre positif"),

    body("steps")
        .isArray()
        .withMessage("Les étapes doivent être un tableau"),

    body("steps.*.step_number")
        .notEmpty()
        .withMessage("Le numéro de l'étape est requis")
        .isInt({ min: 1 })
        .withMessage("Le numéro de l'étape doit être un entier positif"),

    body("steps.*.description")
        .notEmpty()
        .withMessage("La description de l'étape est requise")
        .isString()
        .withMessage("La description de l'étape doit être une chaîne de caractères valide"),
];

export const importRecipeValidator = [
    body("url")
        .notEmpty()
        .withMessage("L'URL est requise")
        .isURL()
        .withMessage("L'URL doit être valide"),
];

export const updateRecipeValidator = [
    body("title")
        .optional()
        .isString()
        .withMessage("Le titre doit être une chaîne de caractères valide")
        .isLength({ max: 100 })
        .withMessage("Le titre doit contenir moins de 100 caractères"),

    body("description")
        .optional()
        .isString()
        .withMessage("La description doit être une chaîne de caractères valide"),

    body("prepTime")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Le temps de préparation doit être un entier positif"),

    body("cookTime")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Le temps de cuisson doit être un entier positif"),

    body("servings")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Le nombre de portions doit être un entier positif"),

    body("ingredients")
        .optional()
        .isArray()
        .withMessage("Les ingrédients doivent être un tableau"),

    body("ingredients.*.name")
        .notEmpty()
        .withMessage("Le nom de l'ingrédient est requis")
        .isString()
        .withMessage("Le nom de l'ingrédient doit être une chaîne de caractères valide"),

    body("ingredients.*.unit")
        .optional()
        .isString()
        .withMessage("L'unité de l'ingrédient doit être une chaîne de caractères valide"),

    body("ingredients.*.type")
        .optional()
        .isString()
        .withMessage("Le type de l'ingrédient doit être une chaîne de caractères valide"),

    body("ingredients.*.quantity")
        .notEmpty()
        .withMessage("La quantité de l'ingrédient est requise")
        .isFloat({ min: 0 })
        .withMessage("La quantité de l'ingrédient doit être un nombre positif"),

    body("steps")
        .optional()
        .isArray()
        .withMessage("Les étapes doivent être un tableau"),

    body("steps.*.step_number")
        .notEmpty()
        .withMessage("Le numéro de l'étape est requis")
        .isInt({ min: 1 })
        .withMessage("Le numéro de l'étape doit être un entier positif"),

    body("steps.*.description")
        .notEmpty()
        .withMessage("La description de l'étape est requise")
        .isString()
        .withMessage("La description de l'étape doit être une chaîne de caractères valide"),

    body("tags")
        .optional()
        .isArray()
        .withMessage("Les tags doivent être un tableau"),

    body("tags.*")
        .isString()
        .withMessage("Chaque tag doit être une chaîne de caractères")
        .isLength({ min: 1, max: 50 })
        .withMessage("Chaque tag doit contenir entre 1 et 50 caractères"),
];

export const uploadRecipeImageValidator = [
    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier valide"),
]

export const getRecipeByIdValidator = [
    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier valide"),
];

export const addIngredientsToShoppingListValidator = [
    query("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier valide"),
];

export const searchRecipesValidator = [
    query("name")
        .optional()
        .isString()
        .withMessage("Le nom doit être une chaîne de caractères"),
    query("tag")
        .optional()
        .isString()
        .withMessage("Le tag doit être une chaîne de caractères"),
    query("servings")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Le nombre de portions doit être un entier positif"),
    query("prepTime")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Le temps de préparation doit être un entier positif"),
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La page doit être un entier positif"),
];

export async function doRecipeExistsParam(req, res, next) {
    const recipeId = req.params.recipeId || req.query.recipeId;

    try {
        const recipe = await getRecipeById(recipeId);
        if (recipe.length === 0) {
            return res.status(404).send({
                message: "Recette introuvable",
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

export async function doRecipeExistsBody(req, res, next) {
    const recipeId = req.body.recipeId;

    try {
        const recipe = await getRecipeById(recipeId);
        if (recipe.length === 0) {
            return res.status(404).send({
                message: "Recette introuvable",
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
            const cookbookId = await getCookbookIdForRecipe(recipeId);
            const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
            if (role === "owner" || role === "editor") {
                next()
            } else {
                return res.status(403).send({
                    message: "Tu n'as pas la permission d'effectuer cette action sur ce cookbook",
                })
            }
        } else {
            const recipe = await getRecipeById(recipeId);

            if (recipe[0].owner === userId) {
                next()
            } else {
                return res.status(403).send({
                    message: "Tu n'as pas la permission d'effectuer cette action",
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
    const recipeId = req.params.recipeId || req.query.recipeId;

    try {
        const isRequestedRecipeInCookbook = await isRecipeInCookbook(recipeId);
        if (isRequestedRecipeInCookbook) {
            const cookbookId = await getCookbookIdForRecipe(recipeId);
            const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
            if (role === "owner" || role === "editor" || role === "viewer") {
                next()
            } else {
                return res.status(403).send({
                    message: "Tu n'as pas la permission d'effectuer cette action",
                })
            }
        } else {
            const recipe = await getRecipeById(recipeId);
            if (recipe[0].owner === userId) {
                next()
            } else {
                return res.status(403).send({
                    message: "Tu n'as pas la permission d'effectuer cette action",
                })
            }
        }
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        })
    }

}
