import {Router} from "express";
import {uploadRecipeImage} from "../middlewares/asset.middleware.js";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {validate} from "../middlewares/validate.js";
import {
    createRecipeValidator,
    doRecipeExistsParam, doUserHasViewPermission, doUserHasWritePermission, getRecipeByIdValidator,
    uploadRecipeImageValidator
} from "../middlewares/recipe.middleware.js";
import {createRecipe, getRecipeById, updateImage} from "../controllers/recipe.controller.js";

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
 *             required: [title, preptime, cooktime, servings]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               preptime:
 *                 type: integer
 *               cooktime:
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
 *                       type: string
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
router.post("/:recipeId/image", [rateLimitGeneral, verifyToken, uploadRecipeImage, uploadRecipeImageValidator, validate, doRecipeExistsParam, doUserHasWritePermission], async (req, res) => {
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

router.get("/:id", [rateLimitGeneral, verifyToken, getRecipeByIdValidator, validate, doRecipeExistsParam, doUserHasViewPermission], async (req, res) => {
    const id = req.params.id;

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

export default router;