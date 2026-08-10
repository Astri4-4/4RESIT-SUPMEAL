import {Router} from 'express';
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {
    createPlanItemValidator,
    getMealPlanValidator,
    hasRightToWrite,
    hasRightToRead,
    updatePlanItemValidator,
    deletePlanItemValidator,
    doesPlanItemExist
} from "../middlewares/plan.middleware.js";
import {validate} from "../middlewares/validate.js";
import {createPlanItem, getPlanById, updatePlanItem, deletePlanItem} from "../controllers/plan.controller.js";

const router = Router();

router.post("/:planId", [rateLimitGeneral, verifyToken, createPlanItemValidator, validate, hasRightToWrite], async (req, res) => {
    const planId = req.params.planId;
    const { date, recipeId } = req.body;

    try {
        const result = await createPlanItem(planId, date, recipeId);
        res.status(201).json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

})

router.get("/:planId", [rateLimitGeneral, verifyToken, getMealPlanValidator, validate, hasRightToRead], async (req, res) => {
    const planId = req.params.planId;

    try {
        const result = await getPlanById(planId);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

})

router.patch("/:planId/items/:itemId", [rateLimitGeneral, verifyToken, updatePlanItemValidator, validate, hasRightToWrite, doesPlanItemExist], async (req, res) => {
    const itemId = req.params.itemId;
    const { date, recipeId } = req.body;

    try {
        const result = await updatePlanItem(itemId, { date, recipeId });
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

})

router.delete("/:planId/items/:itemId", [rateLimitGeneral, verifyToken, deletePlanItemValidator, validate, hasRightToWrite, doesPlanItemExist], async (req, res) => {
    const itemId = req.params.itemId;

    try {
        await deletePlanItem(itemId);
        res.status(200).json({ message: "Plan item deleted successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

})

export default router;