import {Router} from 'express';
import {getMyself} from "../controllers/user.controller.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {validate} from "../middlewares/validate.js";

const router = Router();

router.get("/me", [verifyToken, validate], async (req, res) => {
    try {
        const user = await getMyself(req.user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

export default router;