import {Router} from 'express';
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {validate} from "../middlewares/validate.js";
import {
    doTokenUserExistsById,
    updateUserValidator
} from "../middlewares/user.middleware.js";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {deleteUser, getUserById, updateUser} from "../controllers/user.controller.js";

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
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during deletion", error: error.message });
    }
})

export default router