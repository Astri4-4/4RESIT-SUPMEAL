import {Router} from 'express';
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {validate} from "../middlewares/validate.js";
import {
    doParamUserExistsById,
    doTokenUserExistsById,
    getUserByIdValidator,
    updateUserValidator
} from "../middlewares/user.middleware.js";
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {deleteUser, getUserById, updateUser} from "../controllers/user.controller.js";

const router = Router();

router.get("/me", [rateLimitGeneral, verifyToken, doTokenUserExistsById, validate], async (req, res) => {
    try {
        const user = await getUserById(req.user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

router.get("/:id", [rateLimitGeneral, verifyToken, getUserByIdValidator, validate, doParamUserExistsById], async (req, res) => {
    try {
        const user = await getUserById({id: req.params.id});
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.put("/:id", [rateLimitGeneral, verifyToken, updateUserValidator, validate, doTokenUserExistsById], async (req, res) => {
    const updates = req.body;
    const user = req.user;
    try {
        const updatedUser = await updateUser(user, updates);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.delete("/", [rateLimitGeneral, verifyToken, doTokenUserExistsById], async (req, res) => {
    const user = req.user;
    try {
        await deleteUser(user);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error during deletion", error: error.message });
    }
})

export default router