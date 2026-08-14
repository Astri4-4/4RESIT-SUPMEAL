import { Router } from "express";
import passport from "../config/passport.js";
import * as authController from "../controllers/auth.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";
import {validate} from "../middlewares/validate.js";
import {rateLimitGeneral, rateLimitLogin, rateLimitRegister} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
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
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error, email or username already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error registering user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", [rateLimitRegister, authMiddleware.registerValidation, authMiddleware.isEmailUsed, authMiddleware.isUsernameUsed, validate], async (req, res) => {
    const user = req.body;
    try {
        await authController.register(user);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth login flow
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google's consent screen
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Google authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth/google/failure" }),
    (req, res) => {
        const user = req.user;
        user.token = authController.generateToken(user);
        user.password_hash = undefined;
        res.redirect(process.env.GOOGLE_REDIRECT_URI + "?token=" + user.token);
    }
);

router.get("/google/failure", (req, res) => {
    res.status(401).json({ message: "Google authentication failed" });
});

router.get("/me", [rateLimitGeneral, verifyToken], (req, res) => {
    const user = req.user;
    res.status(200).json({ message: "User info retrieved successfully", user });
})

export default router;