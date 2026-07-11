import {body, param} from "express-validator";
import * as cookbookService from "../services/cookbook.service.js";

export const createCookbookValidator = [
    body("title")
        .notEmpty()
        .withMessage("Title is required")
        .isString()
        .withMessage("Title must be a valid string")
        .isLength({
            max: 100,
        })
        .withMessage("Title must be less than 100 characters"),

    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a valid string"),
];

export const updateCookbookValidator = [
    body("title")
        .optional()
        .isString()
        .withMessage("Title must be a valid string")
        .isLength({
            max: 100,
        })
        .withMessage("Title must be less than 100 characters"),

    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a valid string"),
    param("id")
        .notEmpty()
        .withMessage("Id is required")
        .isInt({ min: 1 })
        .withMessage("Id must be a positive integer"),
]

export const getCookbookValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("Cookbook ID is required")
        .isInt({ min: 1 })
        .withMessage("Cookbook ID must be a positive integer"),
];

export const addMemberToCookbookValidator = [
    param("id")
        .notEmpty()
        .withMessage("Cookbook ID is required")
        .isInt({ min: 1 })
        .withMessage("Cookbook ID must be a positive integer"),

    body("userId")
        .notEmpty()
        .withMessage("User ID is required")
        .isInt({ min: 1 })
        .withMessage("User ID must be a positive integer"),

    body("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["owner", "editor", "viewer"])
        .withMessage("Role must be one of the following: owner, editor, viewer"),
];

export async function doCookbookExistsById(req, res, next) {
    const cookbookId = req.params.cookbookId;
    try {
        const cookbook = await cookbookService.getCookbookById(cookbookId);
        if (!cookbook) {
            return res.status(404).json({ message: "Cookbook not found" });
        }
        req.cookbook = cookbook;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function isMemberOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;

    try {
        const isMember = await cookbookService.isInCookbook(cookbookId, userId);
        if (!isMember) {
            return res.status(404).json({ message: "Cookbook not found" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }

}

export async function isBodyUserNotMemberOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.body.userId;

    try {
        const isMember = await cookbookService.isInCookbook(cookbookId, userId);
        if (isMember) {
            return res.status(400).json({ message: "Already a member of this cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function isOwnerOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;
    try {
        const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
        if (role !== "owner") {
            return res.status(403).json({ message: "Forbidden: You are not the owner of this cookbook" });
        }
        next();
    } catch (error) {

    }
}

export async function isEditorOrOwnerOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;
    try {
        const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
        if (role !== "owner" && role !== "editor") {
            return res.status(403).json({ message: "Forbidden: You are not the owner or editor of this cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}