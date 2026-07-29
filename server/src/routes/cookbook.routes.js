import { Router } from "express";
import fs from "fs/promises";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {
    addMemberToCookbookValidator, changeRoleInCookbookValidator,
    createCookbookValidator,
    doCookbookExistsById,
    getCookbookValidator, hasRightToKick,
    isBodyUserNotMemberOfCookbook,
    isEditorOrOwnerOfCookbook,
    isMemberOfCookbook,
    isOwnerOfCookbook,
    updateCookbookValidator
} from "../middlewares/cookbook.middleware.js";
import {validate} from "../middlewares/validate.js";
import {doTokenUserExistsById} from "../middlewares/user.middleware.js";
import {uploadCookbookImage, deleteCookbookImage} from "../middlewares/asset.middleware.js";
import {
    addUserToCookbook, changeRoleInCookbook,
    createCookbook, deleteCookbook,
    getCookbookById,
    getCookbookMembers,
    getCookbooksByUserId, quitOrKickMember, updateCookbook
} from "../controllers/cookbook.controller.js";

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
    console.log(`Adding user ${userId} with role ${role} to cookbook ${cookbookId}`);

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
        res.status(200).json({ message: "Cookbook deleted successfully" });
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
        res.status(200).json({ message: "User removed from cookbook successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

export default router;