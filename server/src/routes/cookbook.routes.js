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

// Create a new cookbook
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

// Get all cookbooks in which the user is a member
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

// Get a specific cookbook by ID
router.get("/:cookbookId", [rateLimitGeneral, verifyToken, getCookbookValidator, validate, doCookbookExistsById, isMemberOfCookbook, validate], async ( req, res ) => {
    const cookbookId = req.params.cookbookId;
    try {
        const result = await getCookbookById(cookbookId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users in a cookbook
router.get("/:cookbookId/users", [rateLimitGeneral, verifyToken, getCookbookValidator, validate, doCookbookExistsById, isMemberOfCookbook, validate], async (req, res) => {
    const cookbookId = req.params.cookbookId;
    try {
        const members = await getCookbookMembers(cookbookId);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a cookbook by id
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

// Add a user to a cookbook
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

// Change role of a user in a cookbook
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

router.delete("/:cookbookId", [rateLimitGeneral, verifyToken, doCookbookExistsById, isMemberOfCookbook, isOwnerOfCookbook], async (req, res) => {
    const cookbookId = req.params.cookbookId;

    try {
        await deleteCookbook(cookbookId, { is_deleted: true });
        res.status(200).json({ message: "Cookbook deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

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