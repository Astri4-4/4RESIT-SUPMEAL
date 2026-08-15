import {Router} from "express";
import {getAllTags} from "../controllers/tag.controller.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const tag = await getAllTags();
        res.status(200).json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message,
        })
    }
})

export default router;