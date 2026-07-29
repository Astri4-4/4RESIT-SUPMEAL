import {Router} from "express";
import {uploadRecipeImage} from "../middlewares/asset.middleware.js";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {validate} from "../middlewares/validate.js";
import {
    createRecipeValidator,
    doRecipeExistsParam, doUserHasViewPermission, doUserHasWritePermission, getRecipeByIdValidator,
    searchRecipesValidator, updateRecipeValidator,
    uploadRecipeImageValidator
} from "../middlewares/recipe.middleware.js";
import {createRecipe, deleteRecipe, getRecipeById, searchRecipes, updateImage, updateRecipe} from "../controllers/recipe.controller.js";

const router = Router();

// CREATE NEW RECIPE

/**
 * @openapi
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, prepTime, servings, ingredients, steps]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               prepTime:
 *                 type: integer
 *               cookTime:
 *                 type: integer
 *               servings:
 *                 type: integer
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     step_number:
 *                       type: integer
 *                     description:
 *                       type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     unit:
 *                       type: string
 *                     type:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: The created recipe
 *       500:
 *         description: Error creating recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", [rateLimitGeneral, verifyToken, createRecipeValidator, validate], async (req, res) => {
    const recipe = req.body;
    recipe.owner = req.user.id
    try {
        const result = await createRecipe(recipe);
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
});

/**
 * @openapi
 * /recipes/{recipeId}/image:
 *   post:
 *     summary: Upload or replace a recipe's image
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: The uploaded image URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *       400:
 *         description: No image file provided or upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:recipeId/image", [rateLimitGeneral, verifyToken, uploadRecipeImageValidator, validate, doRecipeExistsParam, doUserHasWritePermission, uploadRecipeImage], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `/public/recipe_image/${req.file.filename}`;
    try {
        const result = await updateImage(imageUrl, req.params.recipeId);
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
});

/**
 * @openapi
 * /recipes/{recipeId}:
 *   get:
 *     summary: Get a recipe by id
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested recipe
 *       403:
 *         description: You do not have permission to view this recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error retrieving recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:recipeId", [rateLimitGeneral, verifyToken, getRecipeByIdValidator, validate, doRecipeExistsParam, doUserHasViewPermission], async (req, res) => {
    const id = req.params.recipeId;

    try {
        const recipe = await getRecipeById(id);
        res.status(200).json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message
        })
    }

})

/**
 * @openapi
 * /recipes:
 *   get:
 *     summary: Search recipes by name, tag, servings, and/or max prep time
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Partial, case-insensitive match on recipe title
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Partial, case-insensitive match on an associated tag name
 *       - in: query
 *         name: servings
 *         schema:
 *           type: integer
 *         description: Exact number of servings
 *       - in: query
 *         name: prepTime
 *         schema:
 *           type: integer
 *         description: Maximum prep time in minutes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (10 results per page)
 *     responses:
 *       200:
 *         description: Matching recipes
 *       400:
 *         description: Invalid search parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error searching recipes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", [rateLimitGeneral, verifyToken, searchRecipesValidator, validate], async (req, res) => {
    const queries = req.query;
    try {
        const result = await searchRecipes(queries);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message
        })
    }
})

/**
 * @openapi
 * /recipes/{recipeId}:
 *   patch:
 *     summary: Update a recipe (fields, ingredients, steps, and/or tags)
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               prepTime:
 *                 type: integer
 *               cookTime:
 *                 type: integer
 *               servings:
 *                 type: integer
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     unit:
 *                       type: string
 *                     type:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     step_number:
 *                       type: integer
 *                     description:
 *                       type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: The updated recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Error updating recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:recipeId", [rateLimitGeneral, verifyToken, getRecipeByIdValidator, updateRecipeValidator, validate, doRecipeExistsParam, doUserHasWritePermission], async (req, res) => {
    const recipeId = req.params.recipeId;

    try {
        const result = await updateRecipe(recipeId, req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message
        })
    }
})

/**
 * @openapi
 * /recipes/{recipeId}:
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       403:
 *         description: You do not have permission to delete this recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error deleting recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:recipeId", [rateLimitGeneral, verifyToken, getRecipeByIdValidator, validate, doRecipeExistsParam, doUserHasWritePermission], async (req, res) => {
    const recipeId = req.params.recipeId;

    try {
        await deleteRecipe(recipeId);
        res.status(200).json({ message: "Recipe deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message
        })
    }
})

export default router;