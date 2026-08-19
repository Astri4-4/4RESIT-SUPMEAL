import {Router} from 'express';
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {validate} from "../middlewares/validate.js";
import {
    doTokenUserExistsById,
    importUserDataValidator,
    updatePreferencesValidator,
    updateUserValidator
} from "../middlewares/user.middleware.js";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {
    deleteUser,
    exportUserData,
    getRecentActivities,
    getUserById,
    getUserPreferences,
    importUserData,
    lookupUserByEmail,
    updateUser,
    updateUserPreferences
} from "../controllers/user.controller.js";

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The current user
 *       500:
 *         description: Error retrieving user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", [rateLimitGeneral, verifyToken, doTokenUserExistsById, validate], async (req, res) => {
    try {
        const user = await getUserById(req.user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

/**
router.get("/:id", [rateLimitGeneral, verifyToken, getUserByIdValidator, validate, doParamUserExistsById], async (req, res) => {
    try {
        const user = await getUserById({id: req.params.id});
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
*/
/**
 * @openapi
 * /users:
 *   put:
 *     summary: Update the currently authenticated user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: The updated user
 *       500:
 *         description: Error updating user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/", [rateLimitGeneral, verifyToken, updateUserValidator, validate, doTokenUserExistsById], async (req, res) => {
    const updates = req.body;
    const user = req.user;
    try {
        const updatedUser = await updateUser(user, updates);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /users:
 *   delete:
 *     summary: Delete the currently authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       500:
 *         description: Error during deletion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/", [rateLimitGeneral, verifyToken, doTokenUserExistsById], async (req, res) => {
    const user = req.user;
    try {
        await deleteUser(user);
        res.json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
})

/**
 * @openapi
 * /users/me/preferences:
 *   get:
 *     summary: Get the authenticated user's dietary preference tags
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The user's preference tags
 *       500:
 *         description: Error retrieving preferences
 */
router.get("/me/preferences", [rateLimitGeneral, verifyToken, doTokenUserExistsById], async (req, res) => {
    try {
        const tags = await getUserPreferences(req.user.id);
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /users/me/preferences:
 *   put:
 *     summary: Replace the authenticated user's dietary preference tags
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tagIds]
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: The updated preference tags
 *       500:
 *         description: Error updating preferences
 */
router.put("/me/preferences", [rateLimitGeneral, verifyToken, doTokenUserExistsById, updatePreferencesValidator, validate], async (req, res) => {
    try {
        const tags = await updateUserPreferences(req.user.id, req.body.tagIds);
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /users/me/activities:
 *   get:
 *     summary: Get the authenticated user's recent activity feed across their cookbooks
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: The recent activities
 *       500:
 *         description: Error retrieving activities
 */
router.get("/me/activities", [rateLimitGeneral, verifyToken, doTokenUserExistsById], async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const activities = await getRecentActivities(req.user.id, limit);
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /users/lookup:
 *   get:
 *     summary: Look up a user by exact email address (used to invite members to a cookbook)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The matching user
 *       400:
 *         description: Missing email query parameter
 *       404:
 *         description: No user found with this email
 *       500:
 *         description: Error looking up user
 */
router.get("/lookup", [rateLimitGeneral, verifyToken, doTokenUserExistsById], async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ message: "L'adresse e-mail est requise" });
    }

    try {
        const user = await lookupUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "Aucun utilisateur trouvé avec cette adresse e-mail" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /users/me/export:
 *   get:
 *     summary: Export the authenticated user's recipes and cookbooks as JSON
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The exported data
 *       500:
 *         description: Error exporting data
 */
router.get("/me/export", [rateLimitGeneral, verifyToken, doTokenUserExistsById], async (req, res) => {
    try {
        const data = await exportUserData(req.user.id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

/**
 * @openapi
 * /users/me/import:
 *   post:
 *     summary: Import recipes and cookbooks from a previously exported JSON file
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipes:
 *                 type: array
 *               cookbooks:
 *                 type: array
 *     responses:
 *       201:
 *         description: Import summary
 *       500:
 *         description: Error importing data
 */
router.post("/me/import", [rateLimitGeneral, verifyToken, doTokenUserExistsById, importUserDataValidator, validate], async (req, res) => {
    try {
        const result = await importUserData(req.user.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router