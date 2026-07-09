import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";
import {validate} from "../middlewares/validate.js";
import {rateLimitLogin, rateLimitRegister} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", [rateLimitRegister, authMiddleware.registerValidation, authMiddleware.isEmailUsed, authMiddleware.isUsernameUsed, validate], async (req, res) => {
    const user = req.body;
    try {
        await authController.register(user);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
});

router.post("/login", [rateLimitLogin, authMiddleware.loginValidation, validate], async (req, res) => {
    const userCreds = req.body;

    try {
        const user = await authController.login(userCreds);
        user.password_hash = undefined;
        res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        res.status(401).json({ message: "Invalid credentials", error: error.message });
    }
})

export default router;