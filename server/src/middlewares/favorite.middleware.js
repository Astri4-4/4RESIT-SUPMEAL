import {body, param} from "express-validator";
import {getFavoriteById} from "../services/favorite.service.js";

export const addFavoriteValidator = [
    body("recipeId")
        .notEmpty().withMessage("recipeId is required")
        .isInt({min: 1}).withMessage("recipeId must be a positive number")
];

export const deleteFavoriteValidator = [
    param("id")
        .notEmpty().withMessage("favoriteId is required")
        .isInt({min: 1}).withMessage("favoriteId must be a positive number")
]

export async function isOwnerOfFavorite(req, res, next) {
    const userId = req.user.id;

    try {
        const favorite = await getFavoriteById(req.params.id);
        if (favorite.user_id !== userId) {
            res.status(403).send({error: "You are not the owner of this favorite"});
        } else {
            next();
        }
    } catch (e) {
        res.status(500).send({error: e});
    }

}

export async function doFavoriteExists(req, res, next) {
    const id = req.params.id;

    try {
        const favorite = await getFavoriteById(id);
        if (!favorite) {
            return res.status(404).send({error: "Could not find favorite"});
        }
        next()
    } catch (e) {
        res.status(500).send({error: e});
    }

}