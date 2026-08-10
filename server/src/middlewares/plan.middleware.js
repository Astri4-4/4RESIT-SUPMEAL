import {body, param} from "express-validator";
import {getPlanById, getPlanItemById} from "../services/plan.service.js";
import {isInCookbook, getUserRoleInCookbook} from "../services/cookbook.service.js";
import {doUserHasWritePermission} from "./recipe.middleware.js";

export const createPlanItemValidator = [
    param("planId")
        .notEmpty()
        .withMessage("Plan ID is required")
        .isInt({ min: 1 })
        .withMessage("Plan ID must be a positive integer"),

    body("recipeId")
        .notEmpty()
        .withMessage("Recipe ID is required")
        .isInt({ min: 1 })
        .withMessage("Recipe ID must be a positive integer"),

    body("date")
        .notEmpty()
        .withMessage("Date is required")
        .isISO8601()
        .withMessage("Date must be a valid ISO 8601 date")
];

export const getMealPlanValidator = [
    param("planId")
        .notEmpty()
        .withMessage("Plan ID is required")
        .isInt({ min: 1 })
        .withMessage("Plan ID must be a positive integer"),
]

export const updatePlanItemValidator = [
    param("planId")
        .notEmpty()
        .withMessage("Plan ID is required")
        .isInt({ min: 1 })
        .withMessage("Plan ID must be a positive integer"),

    param("itemId")
        .notEmpty()
        .withMessage("Item ID is required")
        .isInt({ min: 1 })
        .withMessage("Item ID must be a positive integer"),

    body("recipeId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Recipe ID must be a positive integer"),

    body("date")
        .optional()
        .isISO8601()
        .withMessage("Date must be a valid ISO 8601 date"),
]

export const deletePlanItemValidator = [
    param("planId")
        .notEmpty()
        .withMessage("Plan ID is required")
        .isInt({ min: 1 })
        .withMessage("Plan ID must be a positive integer"),

    param("itemId")
        .notEmpty()
        .withMessage("Item ID is required")
        .isInt({ min: 1 })
        .withMessage("Item ID must be a positive integer"),
]

export async function doesPlanItemExist(req, res, next) {
    const { planId, itemId } = req.params;

    try {
        const item = await getPlanItemById(itemId);
        if (!item || String(item.meal_plan_id) !== String(planId)) {
            return res.status(404).json({ message: "Plan item not found" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function hasRightToWrite(req, res, next) {
    try {
        const plan = await getPlanById(req.params.planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const userId = req.user.id;

        if (plan.user_id) {
            if (plan.user_id !== userId) {
                return res.status(403).json({
                    error: "You dont have permission to perform this action",
                });
            }
            return next();
        }

        if (plan.cookbook_id) {
            const isMember = await isInCookbook(plan.cookbook_id, userId);
            if (!isMember) {
                return res.status(404).json({ message: "Cookbook not found" });
            }
            const role = await getUserRoleInCookbook(plan.cookbook_id, userId);
            if (role !== "owner" && role !== "editor") {
                return res.status(403).json({
                    error: "You dont have permission to perform this action",
                });
            }
            return next();
        }

        return res.status(403).json({
            error: "You dont have permission to perform this action",
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function hasRightToRead(req, res, next) {
    try {
        const plan = await getPlanById(req.params.planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const userId = req.user.id;

        if (plan.user_id) {
            if (plan.user_id !== userId) {
                return res.status(403).json({
                    error: "You dont have permission to perform this action",
                });
            }
            return next();
        }

        if (plan.cookbook_id) {
            const isMember = await isInCookbook(plan.cookbook_id, userId);
            if (!isMember) {
                return res.status(404).json({ message: "Cookbook not found" });
            }
            return next();
        }

        return res.status(403).json({
            error: "You dont have permission to perform this action",
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}