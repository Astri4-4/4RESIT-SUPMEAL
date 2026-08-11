import { Router } from 'express';
import {rateLimitGeneral} from "../middlewares/rateLimit.middleware.js";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {
    addFavoriteValidator,
    deleteFavoriteValidator,
    doFavoriteExists,
    isOwnerOfFavorite
} from "../middlewares/favorite.middleware.js";
import {validate} from "../middlewares/validate.js";
import {doRecipeExistsBody} from "../middlewares/recipe.middleware.js";
import {addFavorite, deleteFavorite, getFavorites} from "../controllers/favorite.controller.js";

const router = Router();

router.post('/', [rateLimitGeneral, verifyToken, addFavoriteValidator, validate, doRecipeExistsBody], async (req, res) => {
    const userId = req.user.id;
    const { recipeId } = req.body;

    try {
        const favorite = await addFavorite(userId, recipeId);
        res.status(201).send(favorite);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

});

router.get("/", [rateLimitGeneral, verifyToken], async (req, res) => {
    const userId = req.user.id;

    try {
        const favorite = await getFavorites(userId);
        res.status(200).send(favorite);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.delete("/:id", [rateLimitGeneral, verifyToken, deleteFavoriteValidator, validate, doFavoriteExists, isOwnerOfFavorite], async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const favorite = await deleteFavorite(userId, id);
        res.status(200).send(favorite);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

export default router;