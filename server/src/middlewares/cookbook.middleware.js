import {body, param} from "express-validator";
import * as cookbookService from "../services/cookbook.service.js";

export const createCookbookValidator = [
    body("title")
        .notEmpty()
        .withMessage("Le titre est requis")
        .isString()
        .withMessage("Le titre doit être une chaîne de caractères valide")
        .isLength({
            max: 100,
        })
        .withMessage("Le titre doit contenir moins de 100 caractères"),

    body("description")
        .optional()
        .isString()
        .withMessage("La description doit être une chaîne de caractères valide"),
];

export const updateCookbookValidator = [
    body("title")
        .optional()
        .isString()
        .withMessage("Le titre doit être une chaîne de caractères valide")
        .isLength({
            max: 100,
        })
        .withMessage("Le titre doit contenir moins de 100 caractères"),

    body("description")
        .optional()
        .isString()
        .withMessage("La description doit être une chaîne de caractères valide"),
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),
]

export const getCookbookValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),
];

export const addMemberToCookbookValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    body("userId")
        .notEmpty()
        .withMessage("L'identifiant de l'utilisateur est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de l'utilisateur doit être un entier positif"),

    body("role")
        .notEmpty()
        .withMessage("Le rôle est requis")
        .isIn(["owner", "editor", "viewer"])
        .withMessage("Le rôle doit être l'un des suivants : owner, editor, viewer"),
];

export const changeRoleInCookbookValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    param("userId")
        .notEmpty()
        .withMessage("L'identifiant de l'utilisateur est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de l'utilisateur doit être un entier positif"),

    body("role")
        .notEmpty()
        .withMessage("Le rôle est requis")
        .isIn(["owner", "editor", "viewer"])
        .withMessage("Le rôle doit être l'un des suivants : owner, editor, viewer"),
];

export const deleteCookbookValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),
];

export const addRecipeValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    body("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier positif"),
];

export const deleteRecipeValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier positif"),
];

export const postCommentValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier positif"),

    body("comment")
        .notEmpty()
        .withMessage("Le commentaire est requis")
        .isLength({ min: 2, max: 200 })
        .withMessage("Le commentaire doit contenir entre 2 et 200 caractères"),
];

export const getCommentValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier positif"),
]

export const patchCommentValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier positif"),

    param("commentId")
        .notEmpty()
        .withMessage("L'identifiant du commentaire est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du commentaire doit être un entier positif"),

    body("comment")
        .notEmpty()
        .withMessage("Le commentaire est requis")
        .isLength({ min: 2, max: 200 })
        .withMessage("Le commentaire doit contenir entre 2 et 200 caractères"),
]

export const deleteCommentValidator = [
    param("cookbookId")
        .notEmpty()
        .withMessage("L'identifiant du cookbook est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du cookbook doit être un entier positif"),

    param("recipeId")
        .notEmpty()
        .withMessage("L'identifiant de la recette est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la recette doit être un entier positif"),

    param("commentId")
        .notEmpty()
        .withMessage("L'identifiant du commentaire est requis")
        .isInt({ min: 1 })
        .withMessage("L'identifiant du commentaire doit être un entier positif"),
]

export async function doCookbookExistsById(req, res, next) {
    const cookbookId = req.params.cookbookId;
    try {
        const cookbook = await cookbookService.getCookbookById(cookbookId);
        if (!cookbook) {
            return res.status(404).json({ message: "Cookbook introuvable" });
        }
        req.cookbook = cookbook;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

export async function isMemberOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;

    try {
        const isMember = await cookbookService.isInCookbook(cookbookId, userId);
        if (!isMember) {
            return res.status(404).json({ message: "Cookbook introuvable" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }

}

export async function isBodyUserNotMemberOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.body.userId;

    try {
        const isMember = await cookbookService.isInCookbook(cookbookId, userId);
        if (isMember) {
            return res.status(400).json({ message: "Cet utilisateur fait déjà partie de ce cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

export async function isOwnerOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;
    try {
        const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
        if (role !== "owner") {
            return res.status(403).json({ message: "Accès refusé : tu n'es pas le créateur de ce cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

export async function isEditorOrOwnerOfCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;
    try {
        const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
        if (role !== "owner" && role !== "editor") {
            return res.status(403).json({ message: "Accès refusé : tu n'es ni le créateur ni éditeur de ce cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

export async function hasRightToKick(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const userId = req.user.id;
    const targetUserId = req.params.userId;

    const isOwner = await cookbookService.getUserRoleInCookbook(cookbookId, userId) === "owner";

    if (!isOwner) {
        const isHimself = String(userId) === targetUserId;
        if (!isHimself) {
            return res.status(403).json({ message: "Accès refusé : tu n'es pas le créateur de ce cookbook et ne peux pas exclure d'autres membres" });
        }
    }

    next();

}

export async function isRecipeInCookbook(req, res, next) {
    const cookbookId = req.params.cookbookId;
    const recipeId = req.params.recipeId;

    try {
        const isInCookbook = await cookbookService.isRecipeInCookbook(cookbookId, recipeId);
        if (!isInCookbook) {
            return res.status(404).json({ message: "Recette introuvable dans ce cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }

}

export async function doCommentExistOnRecipeId(req, res, next) {
    const commentId = req.params.commentId;

    try {
        const comment = await cookbookService.getCommentById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Commentaire introuvable" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }

}

export async function isOwnerOfComment(req, res, next) {
    const commentId = req.params.commentId;
    const userId = req.user.id;

    try {
        const comment = await cookbookService.getCommentById(commentId);
        if (comment.user_id !== userId) {
            return res.status(403).json({ message: "Accès refusé : tu n'es pas l'auteur de ce commentaire" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error });
    }

}

export async function isUserMemberOfBodyCookbook(req, res, next) {
    const cookbookId = req.body.cookbookId;
    const userId = req.user.id;

    try {
        const isMember = await cookbookService.isInCookbook(cookbookId, userId);
        if (!isMember) {
            return res.status(404).json({ message: "Cookbook introuvable" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

export async function isUserOwnerOrEditorBody(req, res, next) {
    const cookbookId = req.body.cookbookId;
    const userId = req.user.id;
    try {
        const role = await cookbookService.getUserRoleInCookbook(cookbookId, userId);
        if (role !== "owner" && role !== "editor") {
            return res.status(403).json({ message: "Accès refusé : tu n'es ni le créateur ni éditeur de ce cookbook" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}
