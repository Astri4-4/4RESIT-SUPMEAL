import { Router } from "express";
import fs from "fs/promises";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {
    addMemberToCookbookValidator, addRecipeValidator, changeRoleInCookbookValidator,
    createCookbookValidator, deleteCommentValidator, deleteRecipeValidator, doCommentExistOnRecipeId,
    doCookbookExistsById, getCommentValidator,
    getCookbookValidator, hasRightToKick,
    isBodyUserNotMemberOfCookbook,
    isEditorOrOwnerOfCookbook,
    isMemberOfCookbook, isOwnerOfComment,
    isOwnerOfCookbook, isRecipeInCookbook, patchCommentValidator, postCommentValidator,
    updateCookbookValidator
} from "../middlewares/cookbook.middleware.js";
import {validate} from "../middlewares/validate.js";
import {doTokenUserExistsById} from "../middlewares/user.middleware.js";
import {uploadCookbookImage, deleteCookbookImage} from "../middlewares/asset.middleware.js";
import {
    addRecipeToCookbook,
    addUserToCookbook,
    changeRoleInCookbook,
    createCookbook,
    deleteCookbook,
    getCookbookById,
    getCookbookMembers,
    getCookbooksByUserId,
    postComment,
    quitOrKickMember,
    updateCookbook,
    deleteRecipeFromCookbook,
    getCommentsByRecipeId,
    updateComment
} from "../controllers/cookbook.controller.js";
import {doRecipeExistsBody, doRecipeExistsParam, doUserHasWritePermission, searchRecipesValidator} from "../middlewares/recipe.middleware.js";
import {searchRecipesInCookbook} from "../controllers/recipe.controller.js";
import {deleteComment} from "../services/cookbook.service.js";

const router = Router();

/**
 * @openapi
 * /cookbooks/create:
 *   post:
 *     summary: Create a new cookbook
 *     tags: [Cookbooks]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: The created cookbook
 *       400:
 *         description: Validation or upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error creating cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/create", [rateLimitGeneral, verifyToken, validate, doTokenUserExistsById, uploadCookbookImage, createCookbookValidator, validate], async (req, res) => {
    const user = req.user;
    const cookbook = req.body;
    if (req.file) {
        cookbook.imageUrl = `/public/cookbook_image/${req.file.filename}`;
    }
    try {
        const createdCookbook = await createCookbook(user, cookbook);
        res.status(201).json(createdCookbook);
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /cookbooks:
 *   get:
 *     summary: Get all cookbooks in which the current user is a member
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of cookbooks
 *       500:
 *         description: Error retrieving cookbooks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", [rateLimitGeneral, verifyToken, validate], async (req, res) => {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const cookbooks = await getCookbooksByUserId(userId, offset, limit);
        res.status(200).json(cookbooks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /cookbooks/{cookbookId}:
 *   get:
 *     summary: Get a specific cookbook by id
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The cookbook
 *       500:
 *         description: Error retrieving cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:cookbookId", [rateLimitGeneral, verifyToken, getCookbookValidator, validate, doCookbookExistsById, isMemberOfCookbook, validate], async ( req, res ) => {
    const cookbookId = req.params.cookbookId;
    try {
        const result = await getCookbookById(cookbookId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @openapi
 * /cookbooks/{cookbookId}/users:
 *   get:
 *     summary: Get all users/members of a cookbook
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of members
 *       500:
 *         description: Error retrieving members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:cookbookId/users", [rateLimitGeneral, verifyToken, getCookbookValidator, validate, doCookbookExistsById, isMemberOfCookbook, validate], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    try {
            const members = await getCookbookMembers(cookbookId);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @openapi
 * /cookbooks/{cookbookId}:
 *   patch:
 *     summary: Update a cookbook by id
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: The updated cookbook
 *       400:
 *         description: Validation or upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error updating cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:cookbookId", [rateLimitGeneral, verifyToken, uploadCookbookImage, updateCookbookValidator, validate, doCookbookExistsById, isMemberOfCookbook, isOwnerOfCookbook, validate], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const updatedCookbook = req.body;
    const previousImageUrl = req.cookbook.image_url;

    if (req.file) {
        updatedCookbook.image_url = `/public/cookbook_image/${req.file.filename}`;
    }

    try {
        const result = await updateCookbook(cookbookId, updatedCookbook);
        if (req.file && previousImageUrl) {
            await deleteCookbookImage(previousImageUrl);
        }
        res.status(200).json(result);
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: error.message });
    }

})

/**
 * @openapi
 * /cookbooks/{cookbookId}/members:
 *   post:
 *     summary: Add a user to a cookbook
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, role]
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: The membership created
 *       500:
 *         description: Error adding user to cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
    router.post("/:cookbookId/members", [rateLimitGeneral, verifyToken, addMemberToCookbookValidator, validate, doCookbookExistsById, isMemberOfCookbook, isEditorOrOwnerOfCookbook, isBodyUserNotMemberOfCookbook ], async (req, res) => {
    const userId = req.body.userId;
    const role = req.body.role;
    const cookbookId = req.params.cookbookId;

    try {
        const result = await addUserToCookbook(cookbookId, userId, role);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

/**
 * @openapi
 * /cookbooks/{cookbookId}/members/{userId}:
 *   patch:
 *     summary: Change the role of a user in a cookbook
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated membership
 *       500:
 *         description: Error changing role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:cookbookId/members/:userId", [rateLimitGeneral, verifyToken, doCookbookExistsById, isMemberOfCookbook, isEditorOrOwnerOfCookbook, changeRoleInCookbookValidator, validate
], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const userId = req.params.userId;
    const newRole = req.body.role;

    try {
        const result = await changeRoleInCookbook(cookbookId, userId, newRole);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

/**
 * @openapi
 * /cookbooks/{cookbookId}:
 *   delete:
 *     summary: Delete a cookbook
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cookbook deleted successfully
 *       500:
 *         description: Error deleting cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:cookbookId", [rateLimitGeneral, verifyToken, doCookbookExistsById, isMemberOfCookbook, isOwnerOfCookbook], async (req, res) => {
    const cookbookId = req.params.cookbookId;

    try {
        await deleteCookbook(cookbookId, { is_deleted: true });
        res.status(200).json({ message: "Cookbook supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

/**
 * @openapi
 * /cookbooks/{cookbookId}/members/{userId}:
 *   delete:
 *     summary: Remove a user from a cookbook (quit or kick)
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from cookbook successfully
 *       500:
 *         description: Error removing user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:cookbookId/members/:userId", [rateLimitGeneral, verifyToken, doCookbookExistsById, hasRightToKick], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const userId = req.params.userId;

    try {
        await quitOrKickMember(cookbookId, userId);
        res.status(200).json({ message: "Membre retiré du cookbook avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

/**
 * @openapi
 * /cookbooks/{cookbookId}/recipes:
 *   get:
 *     summary: Search recipes within a specific cookbook by name, tag, servings, and/or max prep time
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Matching recipes within the cookbook
 *       400:
 *         description: Invalid search parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cookbook not found
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
router.get("/:cookbookId/recipes", [rateLimitGeneral, verifyToken, getCookbookValidator, searchRecipesValidator, validate, doCookbookExistsById, isMemberOfCookbook], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const queries = req.query;

    try {
        const result = await searchRecipesInCookbook(cookbookId, queries, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
});

/**
 * @openapi
 * /cookbooks/{cookbookId}/recipes:
 *   post:
 *     summary: Add an existing recipe to a cookbook
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipeId]
 *             properties:
 *               recipeId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: The created cookbook/recipe link
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: You do not have permission to add this recipe to the cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cookbook or recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error adding recipe to cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:cookbookId/recipes/", [rateLimitGeneral, verifyToken, doCookbookExistsById, doRecipeExistsBody, isMemberOfCookbook, doUserHasWritePermission, addRecipeValidator], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const recipeId = req.body.recipeId;

    try {
        const result = await addRecipeToCookbook(cookbookId, recipeId, req.user.id);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /cookbooks/{cookbookId}/recipes/{recipeId}:
 *   delete:
 *     summary: Remove a recipe from a cookbook
 *     tags: [Cookbooks]
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The removed cookbook/recipe link
 *       403:
 *         description: You do not have permission to remove this recipe from the cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cookbook not found, recipe not found, or recipe not in this cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error removing recipe from cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:cookbookId/recipes/:recipeId", [rateLimitGeneral, verifyToken, doCookbookExistsById, doRecipeExistsParam, isMemberOfCookbook, doUserHasWritePermission, isRecipeInCookbook, deleteRecipeValidator], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const recipeId = req.params.recipeId;

    try {
        const result = await deleteRecipeFromCookbook(cookbookId, recipeId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

router.post("/:cookbookId/recipes/:recipeId/comments", [rateLimitGeneral, verifyToken, postCommentValidator, validate, doCookbookExistsById, doRecipeExistsParam, isMemberOfCookbook, isRecipeInCookbook], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const recipeId = req.params.recipeId;
    const userId = req.user.id;
    const { comment } = req.body;

    try {
        const result = await postComment(cookbookId, recipeId, userId, comment);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

router.get("/:cookbookId/recipes/:recipeId/comments", [rateLimitGeneral, verifyToken, getCommentValidator, validate, doCookbookExistsById, doRecipeExistsParam, isMemberOfCookbook, isRecipeInCookbook], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    const recipeId = req.params.recipeId;

    try {
        const result = await getCommentsByRecipeId(cookbookId, recipeId);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }

})

router.patch("/:cookbookId/recipes/:recipeId/comments/:commentId", [rateLimitGeneral, verifyToken, patchCommentValidator, validate, doCookbookExistsById, doRecipeExistsParam, isMemberOfCookbook, isRecipeInCookbook, doCommentExistOnRecipeId, isOwnerOfComment], async (req, res) => {
    const commentId = req.params.commentId;
    const comment = req.body.comment;

    try {
        const result = await updateComment(commentId, comment);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }

});

router.delete("/:cookbookId/recipes/:recipeId/comments/:commentId", [rateLimitGeneral, verifyToken, deleteCommentValidator, validate, doCookbookExistsById, doRecipeExistsParam, isMemberOfCookbook, isRecipeInCookbook, doCommentExistOnRecipeId, isOwnerOfComment], async (req, res) => {
    const commentId = req.params.commentId;

    try {
        await deleteComment(commentId);
        res.status(200).json({ message: "Commentaire supprimé avec succès" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }

})

export default router;